import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/shared/Layout';
import { CaseForm } from '@/components/lawyer/CaseForm';
import { Eyebrow } from '@/components/prepd/Eyebrow';

export default function NewCase() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-3xl animate-fade-up">
        <div className="flex items-end justify-between mb-12 border-b border-emerald/10 pb-8">
          <div>
            <button onClick={() => navigate('/dashboard')} className="inline-block mb-4">
              <Eyebrow>← Dashboard</Eyebrow>
            </button>
            <Eyebrow className="block mb-4">New Case File</Eyebrow>
            <h1 className="font-serif text-5xl italic">Open a new matter.</h1>
            <p className="mt-3 text-sm text-emerald/65 max-w-md leading-relaxed">
              The more specific your summary and key facts, the better the AI-generated practice
              questions will be.
            </p>
          </div>
        </div>
        <CaseForm />
      </div>
    </Layout>
  );
}
