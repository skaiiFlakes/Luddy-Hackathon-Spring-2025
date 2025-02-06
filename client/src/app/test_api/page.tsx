"use client"; // This is necessary for client-side features

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const { data, error } = useSWR('http://localhost:8000/predict', fetcher);

  if (error) return <div>Error fetching prediction</div>;
  if (!data) return <div>Loading prediction...</div>;

  return (
    <div>
      <h1>Prediction from FastAPI</h1>
      <p>Prediction: {data.prediction}</p>
    </div>
  );
}
