import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, updateProject } from '../slices/projectSlice';
import { toast } from 'react-toastify';

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Content Writing', 'SEO / Digital Marketing', 'Video Editing', 'Data Science',
  'DevOps / Cloud', 'Cybersecurity', 'Translation', 'Virtual Assistant', 'Other',
];

const DURATIONS = [
  'Less than 1 week', '1–2 weeks', '2–4 weeks', '1–2 months', '2–3 months', '3–6 months', '6+ months',
];

export default function ProjectFormModal({ project, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.projects);
  const isEdit = !!project;

  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || '',
    requiredSkills: project?.requiredSkills?.join(', ') || '',
    budget: project?.budget || '',
    duration: project?.duration || '',
    deadline: project?.deadline ? project.deadline.slice(0, 10) : '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (form.title.length > 150) e.title = 'Title cannot exceed 150 characters.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.category) e.category = 'Category is required.';
    if (!form.budget || isNaN(form.budget) || Number(form.budget) < 1) e.budget = 'Please enter a valid budget.';
    if (!form.duration) e.duration = 'Duration is required.';
    if (form.deadline && new Date(form.deadline) < new Date()) e.deadline = 'Deadline cannot be in the past.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = { ...form, budget: Number(form.budget) };
    const result = isEdit
      ? await dispatch(updateProject({ id: project._id, data: payload }))
      : await dispatch(createProject(payload));

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(isEdit ? 'Project updated successfully!' : 'Project created successfully!');
      onSuccess?.();
      onClose();
    } else {
      toast.error(result.payload || 'Something went wrong.');
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050, overflowY: 'auto' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered my-4">
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h4 className="modal-title fw-bold text-dark">
              {isEdit ? '✏️ Edit Project' : '🚀 Post a New Project'}
            </h4>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 pt-3">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Project Title <span className="text-danger">*</span></label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={`form-control rounded-3 ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="e.g. Build a React E-Commerce Website"
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className={`form-control rounded-3 ${errors.description ? 'is-invalid' : ''}`}
                    placeholder="Describe the project requirements, deliverables, and any technical specifications..."
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`form-select rounded-3 ${errors.category ? 'is-invalid' : ''}`}
                  >
                    <option value="">Select a category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Budget (USD) <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text rounded-start-3">$</span>
                    <input
                      name="budget"
                      type="number"
                      value={form.budget}
                      onChange={handleChange}
                      className={`form-control rounded-end-3 ${errors.budget ? 'is-invalid' : ''}`}
                      placeholder="500"
                      min="1"
                    />
                    {errors.budget && <div className="invalid-feedback">{errors.budget}</div>}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Duration <span className="text-danger">*</span></label>
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    className={`form-select rounded-3 ${errors.duration ? 'is-invalid' : ''}`}
                  >
                    <option value="">Select duration...</option>
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.duration && <div className="invalid-feedback">{errors.duration}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Deadline (Optional)</label>
                  <input
                    name="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={handleChange}
                    className={`form-control rounded-3 ${errors.deadline ? 'is-invalid' : ''}`}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                  {errors.deadline && <div className="invalid-feedback">{errors.deadline}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Required Skills</label>
                  <input
                    name="requiredSkills"
                    value={form.requiredSkills}
                    onChange={handleChange}
                    className="form-control rounded-3"
                    placeholder="React, Node.js, MongoDB (comma-separated)"
                  />
                  <small className="text-muted">Separate skills with commas</small>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button type="button" className="btn btn-light rounded-3 px-4" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={actionLoading}>
                {actionLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />{isEdit ? 'Updating...' : 'Publishing...'}</>
                ) : (
                  isEdit ? '💾 Update Project' : '🚀 Publish Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
