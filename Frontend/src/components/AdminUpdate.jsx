import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp', 'string', 'tree', 'math']),
  visibleTestCases: z.array(z.object({
    input: z.string().min(1), output: z.string().min(1), explanation: z.string().min(1)
  })).min(1),
  hiddenTestCases: z.array(z.object({
    input: z.string().min(1), output: z.string().min(1)
  })).min(1),
  startCode: z.array(z.object({
    language: z.enum(['C++', 'Java', 'JavaScript']),
    initialCode: z.string().min(1)
  })).length(3),
  driverCode: z.array(z.object({
    language: z.enum(['C++', 'Java', 'JavaScript']),
    code: z.string().min(1)
  })).length(3),
  referenceSolution: z.array(z.object({
    language: z.enum(['C++', 'Java', 'JavaScript']),
    completeCode: z.string().min(1)
  })).length(3)
});

function AdminUpdate() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(problemSchema),
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({ control, name: 'visibleTestCases' });
  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({ control, name: 'hiddenTestCases' });

  useEffect(() => {
    axiosClient.get('/problem/getAllProblem')
      .then(r => setProblems(r.data))
      .catch(console.error)
      .finally(() => setLoadingProblems(false));
  }, []);

  const handleSelectProblem = async (problem) => {
    try {
      const { data } = await axiosClient.get(`/problem/problemById/${problem._id}`);
      setSelectedProblem({ ...data, _id: problem._id });

      // Ensure all 3 languages present in arrays
      const langs = ['C++', 'Java', 'JavaScript'];
      const normalizeArr = (arr, keyName) =>
        langs.map(l => arr?.find(x => x.language === l) || { language: l, [keyName]: '' });

      reset({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        visibleTestCases: data.visibleTestCases || [],
        hiddenTestCases: data.hiddenTestCases || [],
        startCode: normalizeArr(data.startCode, 'initialCode'),
        driverCode: normalizeArr(data.driverCode, 'code'),
        referenceSolution: normalizeArr(data.referenceSolution, 'completeCode'),
      });
      setSuccessMsg('');
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Failed to load problem details.');
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await axiosClient.put(`/problem/update/${selectedProblem._id}`, data);
      setSuccessMsg('Problem updated successfully!');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.response?.data || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Update Problem</h1>
      <p className="text-base-content/60 mb-6">Select a problem from the list, edit it, then save.</p>

      {/* Problem Selector */}
      <div className="card bg-base-100 shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Select Problem to Edit
        </h2>
        {loadingProblems ? (
          <div className="flex items-center gap-2 text-base-content/60">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading problems...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
            {problems.map(p => (
              <button
                key={p._id}
                type="button"
                onClick={() => handleSelectProblem(p)}
                className={`btn btn-outline text-left justify-start gap-2 h-auto py-3 ${selectedProblem?._id === p._id ? 'btn-primary' : ''}`}
              >
                <span className={`badge badge-sm ${p.difficulty === 'easy' ? 'badge-success' : p.difficulty === 'medium' ? 'badge-warning' : 'badge-error'}`}>
                  {p.difficulty}
                </span>
                <span className="truncate text-sm">{p.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert alert-success mb-4 animate-fade-in-up">
          <CheckCircle className="w-5 h-5" /><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error mb-4 animate-fade-in-up">
          <AlertCircle className="w-5 h-5" /><span>{errorMsg}</span>
        </div>
      )}

      {/* Edit Form */}
      {selectedProblem && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Title</span></label>
                <input {...register('title')} className={`input input-bordered ${errors.title && 'input-error'}`} />
                {errors.title && <span className="text-error text-sm mt-1">{errors.title.message}</span>}
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea {...register('description')} className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`} />
              </div>
              <div className="flex gap-4">
                <div className="form-control w-1/2">
                  <label className="label"><span className="label-text">Difficulty</span></label>
                  <select {...register('difficulty')} className="select select-bordered">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-control w-1/2">
                  <label className="label"><span className="label-text">Tag</span></label>
                  <select {...register('tags')} className="select select-bordered">
                    <option value="array">Array</option>
                    <option value="linkedList">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">DP</option>
                    <option value="string">String</option>
                    <option value="tree">Tree</option>
                    <option value="math">Math</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-success">Visible Test Cases</h3>
                <button type="button" onClick={() => appendVisible({ input: '', output: '', explanation: '' })} className="btn btn-sm btn-success">+ Add</button>
              </div>
              {visibleFields.map((field, index) => (
                <div key={field.id} className="border border-base-300 p-4 rounded-lg space-y-2">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeVisible(index)} className="btn btn-xs btn-error">Remove</button>
                  </div>
                  <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full input-sm" />
                  <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full input-sm" />
                  <textarea {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="textarea textarea-bordered w-full textarea-sm" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-warning">Hidden Test Cases</h3>
                <button type="button" onClick={() => appendHidden({ input: '', output: '' })} className="btn btn-sm btn-warning">+ Add</button>
              </div>
              {hiddenFields.map((field, index) => (
                <div key={field.id} className="border border-base-300 p-4 rounded-lg space-y-2">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeHidden(index)} className="btn btn-xs btn-error">Remove</button>
                  </div>
                  <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full input-sm" />
                  <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full input-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Code Templates */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
            <div className="space-y-6">
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-primary">{index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}</h3>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm">Initial Code (shown to user)</span></label>
                    <pre className="bg-base-300 p-4 rounded-lg">
                      <textarea {...register(`startCode.${index}.initialCode`)} className="w-full bg-transparent font-mono text-sm" rows={5} />
                    </pre>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm">Driver Code (hidden parser)</span></label>
                    <pre className="bg-base-300 p-4 rounded-lg">
                      <textarea {...register(`driverCode.${index}.code`)} className="w-full bg-transparent font-mono text-sm" rows={5} />
                    </pre>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-sm">Reference Solution</span></label>
                    <pre className="bg-base-300 p-4 rounded-lg">
                      <textarea {...register(`referenceSolution.${index}.completeCode`)} className="w-full bg-transparent font-mono text-sm" rows={5} />
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className={`btn btn-warning w-full text-lg ${submitting ? 'loading' : ''}`} disabled={submitting}>
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying & Saving...</>
            ) : 'Update Problem'}
          </button>
        </form>
      )}
    </div>
  );
}

export default AdminUpdate;
