"use client";

import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Building, DollarSign, ExternalLink, Plus, Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  salaryRange: string | null;
  url: string | null;
  createdAt: string;
  poster: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGold, setIsGold] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: '', company: '', location: '', description: '', salaryRange: '', url: ''
  });
  const [postingJob, setPostingJob] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(res => res.json()),
      fetch('/api/user/profile').then(res => res.json())
    ]).then(([jobsData, profileData]) => {
      if (jobsData.jobs) setJobs(jobsData.jobs);
      if (profileData.user?.subscription === 'GOLD') setIsGold(true);
    }).catch(err => {
      setError('Failed to load jobs');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingJob(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post job');
      
      setJobs(prev => [data.job, ...prev]);
      setShowPostModal(false);
      setNewJob({ title: '', company: '', location: '', description: '', salaryRange: '', url: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPostingJob(false);
    }
  };

  if (loading) {
    return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}><Loader className="spin" size={32} color="var(--accent)" /></div>;
  }

  return (
    <div className="page-container">
      <div className="route-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={28} color="var(--accent)" /> Anti-Tweet Jobs
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
            Find your next opportunity or hire top talent.
          </p>
        </div>
        {isGold && (
          <button onClick={() => setShowPostModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
            <Plus size={18} /> Post a Job
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {!isGold && (
         <div className="glass-panel route-callout-row" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(45deg, rgba(234,179,8,0.1), transparent)' }}>
           <div>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#eab308' }}>Upgrade to Gold to Post Jobs</h3>
             <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Gold members can post unlimited job listings to millions of users.</p>
           </div>
           <button className="btn btn-primary" style={{ background: '#eab308', color: '#000', border: 'none' }}>Upgrade to Gold</button>
         </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <Briefcase size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p>No jobs posted yet.</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="job-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{job.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building size={16} /> {job.company}</span>
                    {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {job.location}</span>}
                    {job.salaryRange && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><DollarSign size={16} /> {job.salaryRange}</span>}
                  </div>
                </div>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    Apply <ExternalLink size={16} />
                  </a>
                )}
              </div>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--foreground)' }}>
                {job.description}
              </div>
              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--card-border)', overflow: 'hidden' }}>
                  {job.poster.avatar ? (
                    <Image src={job.poster.avatar} alt={job.poster.username} width={24} height={24} style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{job.poster.displayName?.[0] || 'U'}</div>
                  )}
                </div>
                <span>Posted by {job.poster.displayName} (@{job.poster.username})</span>
                <span>•</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showPostModal && (
        <div className="modal-sheet" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', position: 'relative' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>Post a New Job</h2>
            <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input required placeholder="Job Title" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="input-field" />
              <input required placeholder="Company" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} className="input-field" />
              <input placeholder="Location (e.g. Remote, San Francisco)" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="input-field" />
              <input placeholder="Salary Range (e.g. $100k - $150k)" value={newJob.salaryRange} onChange={e => setNewJob({...newJob, salaryRange: e.target.value})} className="input-field" />
              <input placeholder="Application URL" type="url" value={newJob.url} onChange={e => setNewJob({...newJob, url: e.target.value})} className="input-field" />
              <textarea required placeholder="Job Description" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="input-field" style={{ minHeight: '120px', resize: 'vertical' }} />
              
              <div className="modal-action-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={postingJob} className="btn btn-primary" style={{ flex: 1 }}>{postingJob ? 'Posting...' : 'Post Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
