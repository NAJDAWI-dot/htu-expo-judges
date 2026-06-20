import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  instructor: string;
  team_members: string;
  description?: string;
}

interface Scores {
  innovation_creativity: number;
  innovation_social: number;
  innovation_features: number;
  prototype_functionality: number;
  prototype_design: number;
  prototype_finishing: number;
  presentation_understanding: number;
  presentation_response: number;
  presentation_delivery: number;
  manufactured_workshops: number;
}

export const Evaluate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { committeeNumber } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [scores, setScores] = useState<Scores>({
    innovation_creativity: 5,
    innovation_social: 5,
    innovation_features: 5,
    prototype_functionality: 5,
    prototype_design: 5,
    prototype_finishing: 5,
    presentation_understanding: 5,
    presentation_response: 5,
    presentation_delivery: 5,
    manufactured_workshops: 5
  });
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !committeeNumber) return;
      
      try {
        // Fetch project details
        const projSnap = await getDoc(doc(db, 'projects', projectId));
        if (projSnap.exists()) {
          setProject({ id: projSnap.id, ...projSnap.data() } as Project);
        } else {
          navigate('/');
          return;
        }

        // Fetch existing evaluation if any
        const evalId = `${projectId}_committee_${committeeNumber}`;
        const evalSnap = await getDoc(doc(db, 'evaluations', evalId));
        if (evalSnap.exists()) {
          const data = evalSnap.data();
          setScores(data.scores || { 
            innovation_creativity: 5, innovation_social: 5, innovation_features: 5,
            prototype_functionality: 5, prototype_design: 5, prototype_finishing: 5,
            presentation_understanding: 5, presentation_response: 5, presentation_delivery: 5,
            manufactured_workshops: 5
          });
          setComments(data.comments || '');
        } else {
          // Check local storage for drafts
          const draftKey = `draft_${projectId}_committee_${committeeNumber}`;
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr);
              if (draft.scores) setScores(draft.scores);
              if (draft.comments) setComments(draft.comments);
            } catch (e) {
              console.error('Failed to parse draft', e);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, committeeNumber, navigate]);

  useEffect(() => {
    if (!loading && projectId && committeeNumber) {
      const draftKey = `draft_${projectId}_committee_${committeeNumber}`;
      localStorage.setItem(draftKey, JSON.stringify({ scores, comments }));
    }
  }, [scores, comments, loading, projectId, committeeNumber]);

  const handleScoreChange = (criteria: keyof Scores, value: number) => {
    setScores(prev => ({ ...prev, [criteria]: value }));
  };

  const handleSave = async () => {
    if (!projectId || !committeeNumber) return;
    setSaving(true);
    
    try {
      const evalId = `${projectId}_committee_${committeeNumber}`;
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      
      await setDoc(doc(db, 'evaluations', evalId), {
        projectId,
        committeeNumber: committeeNumber,
        judgeName: `Committee ${committeeNumber}`,
        scores,
        totalScore,
        comments,
        timestamp: serverTimestamp()
      });
      
      localStorage.removeItem(`draft_${projectId}_committee_${committeeNumber}`);
      navigate('/');
    } catch (e) {
      console.error('Failed to save evaluation', e);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (!project) return null;

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const criteriaList: { key: keyof Scores; label: string; category?: string }[] = [
    { category: 'Innovation and Impact (30 Points)', key: 'innovation_creativity', label: 'Creativity and Originality' },
    { key: 'innovation_social', label: 'Social Impact' },
    { key: 'innovation_features', label: 'Key Features' },
    { category: 'Prototype (30 Points)', key: 'prototype_functionality', label: 'Functionality' },
    { key: 'prototype_design', label: 'Design & Aesthetics' },
    { key: 'prototype_finishing', label: 'Finishing' },
    { category: 'Presentation and Discussion (30 Points)', key: 'presentation_understanding', label: 'Understanding & Explaining of the Problem and Design Solution' },
    { key: 'presentation_response', label: 'Response to Questions' },
    { key: 'presentation_delivery', label: 'Delivery & Visuals' },
    { category: 'Prototypes manufactured in the University’s Workshops (10 Points)', key: 'manufactured_workshops', label: 'Manufactured in Workshops' }
  ];

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '800px' }}>
      <button className="btn btn-secondary" style={{ marginBottom: '2rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Projects
      </button>

      <div className="glass-card mb-8" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Instructor: {project.instructor}</p>
        <div style={{ marginTop: '1rem', background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Team Members:</strong>
          <p>{project.team_members}</p>
        </div>
      </div>

      <div className="glass-card mb-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Evaluation Criteria</h2>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>Total: {totalScore}</span>
            <span style={{ color: 'var(--text-secondary)' }}>/100</span>
          </div>
        </div>

        {criteriaList.map((c) => (
          <div key={c.key}>
            {c.category && (
              <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-primary)', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                {c.category}
              </h3>
            )}
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.label}</label>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{scores[c.key]}<span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 'normal' }}>/10</span></span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="number" 
                  className="form-input"
                  style={{ width: '80px', fontSize: '1.125rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-primary)' }}
                  min="0" 
                  max="10" 
                  value={scores[c.key].toString()}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val > 10) val = 10;
                    if (val < 0) val = 0;
                    handleScoreChange(c.key, val);
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Points (0 - 10)</span>
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '3rem' }}>
          <label className="form-label" style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>Comments & Feedback</label>
          <textarea 
            className="form-textarea mt-4" 
            placeholder="Provide constructive feedback for the team..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Submit Evaluation'}
        </button>
      </div>
    </div>
  );
};
