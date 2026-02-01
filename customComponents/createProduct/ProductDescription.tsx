"use client";

interface Props {
  description: string;
  setDescription: (v: string) => void;
}

export default function ProductDescription({
  description,
  setDescription,
}: Props) {
  return (
    <section className="bg-gray-50 rounded-xl p-9 mb-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-700">Описание</h2>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        maxLength={800}
        placeholder="Расскажите о товаре или услуге подробнее"
        className="w-full resize-none border text-gray-800 text-lg placeholder-gray-400 rounded-xl px-4 py-3 outline-none"
      />

      <p className="text-sm text-right text-gray-500 mt-1">
        {description.length}/800
      </p>
    </section>
  );
}
