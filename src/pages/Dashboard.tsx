import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, CheckCircle2, ChevronRight, Search } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  instructor: string;
  team_members: string;
  status?: string;
  imageUrl?: string;
  section_number?: string;
}

const committeeMapping: Record<string, string[]> = {
  '1': ['smart-cut', 'agrireach', 'black-iris', 'harvest-reach', 'planto', 'prickly-cut', 'tree-minator', 'agrihand', 'baider'],
  '2': ['agriflex', 'khadirha-', 'lettuchop', 'lemonade', 'bymy-green', 'meldora', 'agriharvest', 'tri-core', 'zyo'],
  '3': ['otc', 'bloom--yield-harvesting-device', 'olisweep', 'chilliease', 'cantaloupe-group', 'mango-care', 'cropaid', 'the-garlic-spoon', 'citrapick'],
  '4': ['the-fork', 'harvest-haven', 'solo-field-reaper', 'caulifam', 'laqta', 'kartoffel', 'agroarm', 'strawberry-harvesting-robot', 'von'],
  '5': ['gizr', 'clawtech', 'dash', 'croptech', 'qataf', 'htu-hybrid-harvester', 'future-designers', 'silver-class', 'aphd']
};

export const Dashboard: React.FC = () => {
  const { committeeNumber, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const qProjects = query(collection(db, 'projects'), orderBy('title', 'asc'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const allProjects = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];
      
      // Filter exactly by project ID based on committee mapping
      let validProjectIds = committeeNumber && committeeMapping[committeeNumber] ? committeeMapping[committeeNumber] : [];
      
      // We will re-filter in useEffect if committee is 6 or 7
      
      if (validProjectIds.length > 0 && committeeNumber !== 'phase2' && committeeNumber !== 'phase3') {
        setProjects(allProjects.filter(p => validProjectIds.includes(p.id)));
      } else if (committeeNumber !== 'phase2' && committeeNumber !== 'phase3') {
        // Fallback to section_number if not in mapping
        setProjects(allProjects.filter(p => p.section_number === committeeNumber || p.section_number?.toLowerCase() === committeeNumber?.toLowerCase()));
      }
    });

    let unsubPhase: () => void = () => {};
    if (committeeNumber === 'phase2') {
      unsubPhase = onSnapshot(doc(db, 'phases', '2'), (docSnap) => {
        if (docSnap.exists()) {
          const ids = docSnap.data().projectIds || [];
          getDocs(query(collection(db, 'projects'), orderBy('title', 'asc'))).then(snap => {
            const allP = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];
            setProjects(allP.filter(p => ids.includes(p.id)));
          });
        } else {
          setProjects([]);
        }
      });
    } else if (committeeNumber === 'phase3') {
      unsubPhase = onSnapshot(doc(db, 'phases', '3'), (docSnap) => {
        if (docSnap.exists()) {
          const ids = docSnap.data().projectIds || [];
          getDocs(query(collection(db, 'projects'), orderBy('title', 'asc'))).then(snap => {
            const allP = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];
            setProjects(allP.filter(p => ids.includes(p.id)));
          });
        } else {
          setProjects([]);
        }
      });
    }

    if (committeeNumber) {
      const qEvals = query(collection(db, 'evaluations'));
      const unsubEvals = onSnapshot(qEvals, (snapshot) => {
        const evals: Record<string, boolean> = {};
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.committeeNumber === committeeNumber) {
            evals[data.projectId] = true;
          }
        });
        setEvaluations(evals);
      });
      return () => {
        unsubProjects();
        unsubEvals();
        unsubPhase();
      };
    }
    
    return () => {
      unsubProjects();
      unsubPhase();
    };
  }, [committeeNumber]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const aEval = evaluations[a.id] ? 1 : 0;
    const bEval = evaluations[b.id] ? 1 : 0;
    return aEval - bEval;
  });

  return (
    <div className="app-container animate-fade-in">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Welcome,</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Committee {committeeNumber}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none' }}>
            Leaderboard
          </button>
          <button className="btn btn-secondary" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Select a project to evaluate</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="status-indicator">
            <div className="status-dot dot-green"></div>
            <span>{Object.keys(evaluations).length} Evaluated</span>
          </div>
          <div className="status-indicator">
            <div className="status-dot dot-gray"></div>
            <span>{projects.length - Object.keys(evaluations).length} Pending</span>
          </div>
        </div>
      </div>

      <div className="form-group" style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search projects..." 
          style={{ paddingLeft: '3rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="projects-grid">
        {filteredProjects.map(project => {
          const isEvaluated = evaluations[project.id];
          return (
            <div 
              key={project.id} 
              className="glass-card" 
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/evaluate/${project.id}`)}
            >
              {isEvaluated && (
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--success)', borderRadius: '50%', padding: '4px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>
                  <CheckCircle2 size={24} color="white" />
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <span className={`badge ${isEvaluated ? 'badge-success' : 'badge-pending'}`}>
                  {isEvaluated ? 'Evaluated' : 'Pending'}
                </span>
              </div>
              
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{project.title}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>
                <div><strong>Instructor:</strong> {project.instructor}</div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {isEvaluated ? 'Update Evaluation' : 'Start Evaluation'}
                </span>
                <ChevronRight size={20} color="var(--accent-primary)" />
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center" style={{ padding: '4rem', color: 'var(--text-secondary)' }}>
          No projects found matching your search.
        </div>
      )}
    </div>
  );
};
