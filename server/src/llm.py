import ollama
import pydantic
import json

from datetime import datetime

LLM = "mistral-small-24b"
CFG = {
    'temperature': 0.15,
    'num_ctx': 10000,
}

PERSONAS = {
    "todd"  : open("../static/personas/todd.txt").read(),
    "jeff"  : open("../static/personas/jeff.txt").read(),
    "karen" : open("../static/personas/karen.txt").read()
}

TEMPLATES = {
    "introduction" : open("../static/prompts/introduction.tmpl").read(),
    "technical"    : open("../static/prompts/technical_questions.tmpl").read(),
    "behavioral"   : open("../static/prompts/behavioral_questions.tmpl").read(),
    "follow_up"    : open("../static/prompts/follow_up.tmpl").read(),
    "wrap_up"      : open("../static/prompts/wrap_up.tmpl").read(),
    "feedback"     : open("../static/prompts/feedback.tmpl").read(),
    "closer"       : open("../static/prompts/closer.tmpl").read() 
}

class Questions(pydantic.BaseModel):
    questions: list[str]

class Feedback(pydantic.BaseModel):
    strengths             : list[str];
    areas_for_improvement : list[str];
    suggestions           : list[str];
    grade                 : str;

class Emotion(pydantic.BaseModel):
    score    : int;
    evidence : str;

    def to_dict(self):
        return { "score": self.score, "evidence": self.evidence }

class VoiceAnalysis(pydantic.BaseModel):
    confidence  : Emotion;
    nervousness : Emotion;
    excitement  : Emotion;
    uncertainty : Emotion;
    neutral     : Emotion;    

class Interviewer:
    # Interviewer information.
    persona : str;
    mode    : str;
    name    : str;

    # Candidate information.
    job_desc : str;
    link     : str;
    resume   : str;
    keywords : list[str];

    # Question bank.
    questions    : list[str];
    question_idx : int = 0;

    # State.
    history   : list[any] = [];
    follow_up : bool = True;
    start     : str = "N/A";
    end       : str = "N/A";

    def __init__(self, name, mode, link, job_desc, resume, keywords):
        self.persona  = PERSONAS[name]
        self.name     = name
        self.mode     = mode
        self.link     = link
        self.job_desc = job_desc
        self.resume   = resume
        self.keywords = keywords

        self.persona += f"\n# Job Description\n\n{job_desc}\n\n# Candidate Resume\n\n{resume}\n"

        self.start = now()

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
            self.end = now()
            return None

        question = self.questions[self.question_idx]

        self.history.append(
            {
                "role": "assistant",
                "content": question,
                "time": now()
            }
        )

        self.question_idx += 1

        return question, self.question_idx
    
    def process_response(self, transcript):
        if self.follow_up:
            prompt = TEMPLATES['follow_up']
        else:
            prompt = TEMPLATES['wrap_up']

        self.history.append(
            {
                "role": "user",
                "content": transcript,
                "time": now()
            }
        )

        # messages = [
        #    {'role': 'system', 'content': self.persona},
        #    {'role': 'system', 'content': prompt}
        #]

        # messages += self.history

        # response = ollama.chat(
        #    messages = messages,
        #    options = CFG,
        #    model   = LLM
        #)

        # self.history.append(
        #    {
        #        "role": "assistant",
        #        "content": response.message['content'],
        #        "time": now()
        #    }
        # )

        self.follow_up = not self.follow_up

        return "", False
    
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

        self.history.append(
            {
                "role": "assistant",
                "content": response.message['content'],
                "time": now()
            }
        )

        return response.message.content
    
    def generate_closer(self):
        prompt = TEMPLATES['closer'] % (self.mode)

        messages = [
            {'role': 'system', 'content': self.persona},
            {'role': 'system', 'content': prompt}
        ]

        response = ollama.chat(
            messages = messages,
            options = CFG,
            model   = LLM,
        )

        return response.message.content
    
    def generate_feedback(self):
        answers    = []
        questions  = []
        transcript = ""
        history    = []

        print(self.history)

        for i in range(len(self.history) - 1):
            if i % 2 != 0:
                continue

            q = self.history[i]
            r = self.history[i + 1]

            history.append(
                {
                    "content"     : q['content'],
                    "question_id" : i,
                    "role"        : "interviewer",
                    "timestamp"   : q['time']
                }
            )

            history.append(
                {
                    "content"     : r['content'],
                    "role"        : "candidate",
                    "timestamp"   : r['time']
                }
            )
            print(TEMPLATES['feedback'] % (q['content'], r['content']))
            response = ollama.chat(
                messages = [
                    {'role': 'system', 'content': TEMPLATES['feedback'] % (q['content'], r['content'])}
                ],
                options = CFG,
                model   = LLM,
                format  = Feedback.model_json_schema()
            )

            feedback = Feedback.model_validate_json(response.message.content)

            feedback = {
                'strengths'             : feedback.strengths,
                'areas_for_improvement' : feedback.areas_for_improvement,
                'suggestions'           : feedback.suggestions,
                'grade'                 : feedback.grade,
            }

            feedback = {
                "question"    : q['content'],
                "answer"      : r['content'],
                "question_id" : i,
                "evaluation"  : feedback,
            }

            transcript += f"{q['role']}: {q['content']}\n"
            transcript += f"{r['role']}: {r['content']}\n"

            questions.append(q['content'])
            answers.append(feedback)

        grades = []

        for answer in answers:
            grades.append(
                feedback['evaluation']['grade']
            )

        grades = [grade_to_score(x) for x in grades]
        grades = sum(grades) / len(grades)
        grade  = score_to_grade(grades)

        prompt = f"""
        You are an expert interview coach providing overall feedback on multiple interview responses.

        Here are the questions and responses:

        {transcript}

        Based on all these responses, provide a detailed, holistic assessment of the candidate's interview performance across all questions, including patterns observed, general strengths and weaknesses.

        Return your feedback in a first-person format, as if you were talking directly to the candidate. You do not need to include any framing or templates (e.g. 'best, [your name]'.)
        Make your feedback concise but comprehensive, highlighting the most important patterns across all responses.
        """

        response = ollama.chat(
            model    = LLM,
            options  = CFG,
            messages = [
                {'role': 'system', 'content': prompt}                 
            ]
        )

        grade_value = 0.0

        if grade.startswith("A"):
            grade_value = 0.9 if "+" in grade else (0.85 if "-" in grade else 0.87)
        elif grade.startswith("B"):
            grade_value = 0.8 if "+" in grade else (0.75 if "-" in grade else 0.77)
        elif grade.startswith("C"):
            grade_value = 0.7 if "+" in grade else (0.65 if "-" in grade else 0.67)
        elif grade.startswith("D"):
            grade_value = 0.6 if "+" in grade else (0.55 if "-" in grade else 0.57)

        performance_metrics = {
            "average_score"  : grade_value,
            "overall_rating" : get_rating_from_grade(grade)
        }

        job_desc = json.loads(self.job_desc)
        # job_url job_title job_description company
        output = {
            "answers"   : answers,
            "questions" : questions,
            "metadata"  : {
                "interviewer"     : self.name,
                "interview_type"  : self.mode,
                "start_time"      : self.start,
                "end_time"        : self.end,
                "job_url"         : self.link,
                "job_title"       : job_desc['role'],
                "job_description" : job_desc['job_description'],
                "company"         : job_desc['company']
            },
            "analysis"           : {},
            "full_transcript"    : history,
        }
        
        output['analysis']['performance_metrics'] = performance_metrics
        output['analysis']['overall_feedback']    = response.message.content

        return output

def grade_to_score(grade):
        if grade == "A":
            return 4.0
        elif grade == "B":
            return 3.0
        elif grade == "C":
            return 2.0
        elif grade == "D":
            return 1.0
        elif grade == "F":
            return 0.0
        
def score_to_grade(avg_grade):
    # Convert numeric grade back to letter grade with plus/minus
    if avg_grade >= 3.85:
        overall_grade = "A"
    elif avg_grade >= 3.5:
        overall_grade = "A-"
    elif avg_grade >= 3.15:
        overall_grade = "B+"
    elif avg_grade >= 2.85:
        overall_grade = "B"
    elif avg_grade >= 2.5:
        overall_grade = "B-"
    elif avg_grade >= 2.15:
        overall_grade = "C+"
    elif avg_grade >= 1.85:
        overall_grade = "C"
    elif avg_grade >= 1.5:
        overall_grade = "C-"
    elif avg_grade >= 1.15:
        overall_grade = "D+"
    elif avg_grade >= 0.85:
        overall_grade = "D"
    elif avg_grade >= 0.5:
        overall_grade = "D-"
    else:
        overall_grade = "F"

    return overall_grade


def get_rating_from_grade(grade: str) -> str:
    if grade.startswith("A"):
        return "Excellent"
    elif grade.startswith("B"):
        return "Above Average"
    elif grade.startswith("C"):
        return "Average"
    elif grade.startswith("D"):
        return "Below Average"
    elif grade.startswith("F"):
        return "Poor"
    else:
        return "Not Rated"
    
def now():
    return datetime.now().strftime("%Y%m%d_%H%M%S")