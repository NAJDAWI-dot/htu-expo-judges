import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProjectData {
  id: string;
  title: string;
  section_number?: string;
}

interface EvaluationData {
  projectId: string;
  committeeNumber: string;
  totalScore: number;
  comments: string;
}

export const Leaderboard: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [phases, setPhases] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<number>(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projSnap, evalSnap, phaseSnap] = await Promise.all([
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'evaluations')),
          getDocs(collection(db, 'phases'))
        ]);

        const projData = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectData));
        const evalData = evalSnap.docs.map(d => d.data() as EvaluationData);
        
        const phaseData: Record<string, string[]> = {};
        phaseSnap.docs.forEach(d => {
          phaseData[d.id] = d.data().projectIds || [];
        });

        setProjects(projData);
        setEvaluations(evalData);
        setPhases(phaseData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getLeaderboard = () => {
    let validProjects = projects;
    let comms = ['1', '2', '3', '4', '5'];
    
    if (activePhase === 2) {
      if (!phases['2']) return [];
      validProjects = projects.filter(p => phases['2'].includes(p.id));
      comms = ['phase2'];
    } else if (activePhase === 3) {
      if (!phases['3']) return [];
      validProjects = projects.filter(p => phases['3'].includes(p.id));
      comms = ['phase3'];
    }

    return validProjects.map(p => {
      const projectEvals = evaluations.filter(e => e.projectId === p.id && comms.includes(e.committeeNumber));
      const totalScore = projectEvals.reduce((sum, e) => sum + e.totalScore, 0);
      const avgScore = projectEvals.length ? (totalScore / projectEvals.length).toFixed(1) : '0.0';
      
      return {
        ...p,
        totalScore,
        avgScore: parseFloat(avgScore),
        evalCount: projectEvals.length,
        comments: projectEvals.map(e => `[Comm ${e.committeeNumber}]: ${e.comments}`).join(' | ')
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  };

  const handleExport = () => {
    const data = getLeaderboard().map((row, index) => ({
      Rank: index + 1,
      'Project Title': row.title,
      'Committee': row.section_number || 'N/A',
      'Evaluations': row.evalCount,
      'Average Score (out of 100)': row.avgScore,
      'Comments': row.comments
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaderboard");
    XLSX.writeFile(wb, "Design_Expo_Leaderboard.xlsx");
  };

  const advancePhase = async (phaseNumber: number, topN: number) => {
    if (!window.confirm(`Are you sure you want to advance the Top ${topN} projects to Phase ${phaseNumber}? This will assign them to Committee ${phaseNumber === 2 ? 'phase2' : 'phase3'}.`)) {
      return;
    }
    try {
      const topProjects = getLeaderboard().slice(0, topN).map(p => p.id);
      await setDoc(doc(db, 'phases', phaseNumber.toString()), {
        projectIds: topProjects,
        timestamp: new Date()
      });
      setPhases(prev => ({ ...prev, [phaseNumber.toString()]: topProjects }));
      alert(`Successfully advanced Top ${topN} to Phase ${phaseNumber}!`);
      setActivePhase(phaseNumber);
    } catch (e) {
      console.error(e);
      alert('Failed to advance phase. Did you update Firestore rules?');
    }
  };

  const resetPhase = async (phaseNumber: number) => {
    if (!window.confirm(`Are you sure you want to completely RESET Phase ${phaseNumber}? This will un-assign the projects from Committee ${phaseNumber === 2 ? 'phase2' : 'phase3'}.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'phases', phaseNumber.toString()));
      const newPhases = { ...phases };
      delete newPhases[phaseNumber.toString()];
      setPhases(newPhases);
      setActivePhase(phaseNumber - 1);
      alert(`Phase ${phaseNumber} has been reset.`);
    } catch (e) {
      console.error(e);
      alert('Failed to reset phase.');
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const leaderboard = getLeaderboard();

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '1200px' }}>
      <nav className="navbar" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy color="var(--accent-primary)" /> Master Leaderboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px' }}>
          {[1, 2, 3].map(p => (
            <button 
              key={p}
              className={`btn ${activePhase === p ? 'btn-primary' : ''}`}
              style={{ padding: '0.5rem 1rem', background: activePhase === p ? 'var(--accent-primary)' : 'transparent', border: 'none' }}
              onClick={() => setActivePhase(p)}
            >
              Phase {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          {activePhase === 1 && !phases['2'] && (
            <button className="btn btn-secondary" onClick={() => advancePhase(2, 15)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
              Start Phase 2 (Top 15)
            </button>
          )}
          {activePhase === 2 && !phases['3'] && (
            <>
              <button className="btn btn-secondary" onClick={() => advancePhase(3, 8)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                Start Phase 3 (Top 8)
              </button>
              <button className="btn btn-secondary" onClick={() => resetPhase(2)} style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                Reset Phase 2
              </button>
            </>
          )}
          {activePhase === 3 && (
            <button className="btn btn-secondary" onClick={() => resetPhase(3)} style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>
              Reset Phase 3
            </button>
          )}
          
          <button className="btn btn-primary" onClick={handleExport} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Download size={18} /> Export Excel
          </button>
        </div>
      </nav>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem' }}>Rank</th>
              <th style={{ padding: '1rem' }}>Project Title</th>
              <th style={{ padding: '1rem' }}>Evals</th>
              <th style={{ padding: '1rem' }}>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 3 ? 'var(--accent-primary)' : 'inherit' }}>
                  #{index + 1}
                </td>
                <td style={{ padding: '1rem' }}>{item.title}</td>
                <td style={{ padding: '1rem' }}>{item.evalCount}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.125rem' }}>{item.avgScore}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No evaluations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
