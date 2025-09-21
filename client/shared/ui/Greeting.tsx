'use client';
export default function Greeting({ firstName, login }: { firstName?: string|null; login?: string|null }) {
  const text = firstName ? `Здравствуйте, ${firstName}!` : `Здравствуйте${login ? `, ${login}` : ''}!`;
  return <h2 className="text-lg">{text}</h2>;
}
