import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [committeeInput, setCommitteeInput] = useState('');
  const { setCommittee } = useAuth();
  const navigate = useNavigate();

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeInput.trim()) return;
    
    await setCommittee(committeeInput.trim());
    navigate('/');
  };

  return (
    <div className="app-container" style={{ maxWidth: '600px', paddingTop: '4rem' }}>
      <div className="text-center mb-8 animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Users size={48} color="var(--accent-primary)" />
          </div>
        </div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Judges Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Enter your committee number to view assigned projects</p>
      </div>

      <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleEnter}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '1.125rem' }}>Committee Number</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 1, 2, 3..." 
              value={committeeInput}
              onChange={(e) => setCommitteeInput(e.target.value)}
              autoFocus
              style={{ fontSize: '1.25rem', padding: '1rem' }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              *Please enter the digit only (e.g., "1", "2", "3"), not words (e.g., "one"). For Master Phases, use "phase2" or "phase3".
            </p>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4" 
            style={{ fontSize: '1.125rem', padding: '1rem' }}
            disabled={!committeeInput.trim()}
          >
            Enter Portal <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
