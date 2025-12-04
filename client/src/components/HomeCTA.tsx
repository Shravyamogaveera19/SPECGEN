import { Link } from 'react-router-dom';

export function HomeCTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-purple-900/30 via-black to-green-900/30">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Repository?
        </h2>
        <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
          Begin by validating your GitHub repository. Our platform handles the complexity, delivering professional documentation in minutes.
        </p>
        <Link
          to="/repo-validator"
          className="inline-block rounded-lg px-10 py-5 font-semibold text-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 shadow-xl shadow-purple-500/30 transition-all"
        >
          Get Started Now
        </Link>
      </div>
    </section>
  );
}
