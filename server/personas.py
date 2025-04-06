import ollama
import pydantic

LLM = "mistral-small-24b"
CFG = {
    'temperature': 0.15,
    'num_ctx': 10000,
}

PERSONAS = {
    "todd"  : open("personas/todd.txt").read(),
    "jeff"  : open("personas/jeff.txt").read(),
    "karen" : open("personas/karen.txt").read()
}

TEMPLATES = {
    "introduction" : open("prompts/introduction.tmpl").read(),
    "technical"    : open("prompts/technical_questions.tmpl").read(),
    "behavioral"   : open("prompts/behavioral_questions.tmpl").read(),
    "follow_up"    : open("prompts/follow_up.tmpl").read(),
    "wrap_up"      : open("prompts/wrap_up.tmpl").read(),
    "feedback"      : open("prompts/feedback.tmpl").read()
}

class Questions(pydantic.BaseModel):
    questions: list[str]

class Feedback(pydantic.BaseModel):
    question              : str;
    response              : str;
    strengths             : list[str];
    areas_for_improvement : list[str];
    suggestions           : list[str];
    grade                 : str;

class Interviewer:
    # Interviewer information.
    persona : str;
    mode    : str;

    # Candidate information.
    job_desc : str;
    resume   : str;
    keywords : list[str];

    # Question bank.
    questions    : list[str];
    question_idx : int = 0;

    # State.
    history   : list[any] = [];
    follow_up : bool = True;

    def __init__(self, name, mode, job_desc, resume, keywords):
        self.persona  = PERSONAS[name]
        self.mode     = mode
        self.job_desc = job_desc
        self.resume   = resume
        self.keywords = keywords

        self.persona += f"\n# Job Description\n\n{job_desc}\n\n# Candidate Resume\n\n{resume}\n"

        self.generate_questions()


    def generate_questions(self):
        prompt = TEMPLATES[self.mode] % (self.keywords)

        response = ollama.chat(
            messages = [
                {'role': 'system', 'content': self.persona},
                {'role': 'system', 'content': prompt}
            ],
            options = CFG,
            model   = LLM,
            format  = Questions.model_json_schema()
        )

        self.questions = Questions.model_validate_json(response.message.content).questions

    def next_question(self):
        if self.question_idx >= len(self.questions):
            return None

        question = self.questions[self.question_idx]

        self.history.append(
            {"role": "assistant", "content": question}
        )

        self.question_idx += 1

        return question, self.question_idx
    
    def process_response(self, transcript):
        if self.follow_up:
            prompt = TEMPLATES['follow_up']
        else:
            prompt = TEMPLATES['wrap_up']

        self.history.append(
            {"role": "user", "content": transcript}
        )

        messages = [
            {'role': 'system', 'content': self.persona},
            {'role': 'system', 'content': prompt}
        ]

        messages += self.history

        response = ollama.chat(
            messages = messages,
            options = CFG,
            model   = LLM
        )

        self.history.append(response.message)
        self.follow_up = not self.follow_up

        return response.message.content, not self.follow_up
    
    def generate_introduction(self):
        prompt = TEMPLATES['introduction'] % (self.mode)

        response = ollama.chat(
            messages = [
                {'role': 'system', 'content': self.persona},
                {'role': 'user', 'content': prompt}
            ],
            options = CFG,
            model   = LLM,
        )

        return response.message.content
    
    def generate_closer(self):
        prompt = TEMPLATES['closer'] % (self.mode)

        messages = [
            {'role': 'system', 'content': self.persona},
            {'role': 'system', 'content': prompt}
        ]

        messages += self.history

        response = ollama.chat(
            messages = messages,
            options = CFG,
            model   = LLM,
        )

        return response.message.content
    
    def generate_feedback(self):
        out = []

        for i in range(len(self.history) - 1):
            if i % 2 != 0:
                continue

            q = self.history[i]
            r = self.history[i + 1]

            response = ollama.chat(
                messages = [
                    {'role': 'system', 'content': TEMPLATES['feedback'] % (q, r)}
                ],
                options = CFG,
                model   = LLM,
                format  = Feedback.model_json_schema()
            )

            feedback = Feedback.model_validate_json(response.message.content)

            feedback = {
                'question'              : feedback.question,
                'response'              : feedback.response,
                'strengths'             : feedback.strengths,
                'areas_for_improvement' : feedback.areas_for_improvement,
                'suggestions'           : feedback.suggestions,
                'grade'                 : feedback.grade,
            }

            out.append(feedback)
            
        return out

