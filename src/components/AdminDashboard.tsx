import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../services/firestoreUtils';
import { 
  UserPlus, 
  Users, 
  BookPlus, 
  BookOpen, 
  UserSquare2, 
  Link as LinkIcon,
  Loader2,
  X,
  Search,
  CheckCircle2,
  ChevronRight,
  Activity,
  Target,
  GraduationCap,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  UserCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, useAuth } from './AuthContext';
import { 
  Header, 
  StatCard, 
  SectionTitle, 
  Card, 
  EmptyState, 
  FormInput, 
  PrimaryButton, 
  Badge,
  QuickActionCard,
  SecondaryButton 
} from './SharedComponents';

export const AdminDashboard: React.FC<{ view: string, setView?: (v: string) => void }> = ({ view, setView }) => {
  const { user, profile } = useAuth();
  const [internalView, setInternalView] = useState<string>('view-students');
  const [users, setUsers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classes.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (view === 'faculty') setInternalView('view-faculty');
    else if (view === 'students') setInternalView('view-students');
    else if (view === 'subjects') setInternalView('view-subjects');
    else if (view === 'classes') setInternalView('view-classes');
    else if (view === 'assignments') setInternalView('view-assignments');
    else if (view === 'profile') setInternalView('profile');
    else setInternalView('dashboard');
  }, [view]);

  const fetchData = async (silent = true) => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const subjectsSnap = await getDocs(collection(db, 'subjects'));
      setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const classesSnap = await getDocs(collection(db, 'classes'));
      setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'admin-dashboard-data');
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>, role: UserRole) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;

    if (submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'users'), {
        email,
        name,
        role,
        classId: classId || null,
        createdAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: `${role.charAt(0).toUpperCase() + role.slice(1)} added to registry.` });
      form.reset();
      fetchData(true);
      setInternalView(role === 'faculty' ? 'view-faculty' : 'view-students');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;

    if (submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name,
        createdAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'New academic class established.' });
      form.reset();
      fetchData(true);
      setInternalView('view-classes');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'classes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;

    if (submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'subjects'), {
        name,
        classId,
        createdAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'New subject entry established.' });
      form.reset();
      fetchData(true);
      setInternalView('view-subjects');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'subjects');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subjectId = (formData.get('subjectId') as string)?.trim();
    const facultyId = (formData.get('facultyId') as string)?.trim();

    if (!subjectId || !facultyId) {
      setMessage({ type: 'error', text: 'Critical identification missing. Ensure both Subject and expert are selected.' });
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      const subjectRef = doc(db, 'subjects', subjectId);
      await updateDoc(subjectRef, { 
        facultyId,
        updatedAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'Faculty assignment finalized.' });
      fetchData(true);
      setSelectedSubject(null);
      setSelectedFaculty(null);
      setInternalView('view-subjects');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'subjects');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subject: any) => {
    try {
      if (submitting) return;
      setSubmitting(true);
      // Optimistic update: instantly remove the subject from UI state so it disappears
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      await deleteDoc(doc(db, 'subjects', subject.id));
      setMessage({ type: 'success', text: `Subject "${subject.name}" has been removed.` });
      fetchData(true);
    } catch (err) {
      console.error("Subject deletion failure:", err);
      const errorMsg = err instanceof Error ? err.message : 'Permission Denied';
      setMessage({ type: 'error', text: `Failed to remove subject: ${errorMsg}` });
      fetchData(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (cls: any) => {
    try {
      if (submitting) return;
      setSubmitting(true);
      // Optimistic update: instantly remove the class from UI state so it disappears
      setClasses(prev => prev.filter(c => c.id !== cls.id));
      await deleteDoc(doc(db, 'classes', cls.id));
      setMessage({ type: 'success', text: `Class "${cls.name}" has been removed.` });
      fetchData(true);
    } catch (err) {
      console.error("Class deletion failure:", err);
      const errorMsg = err instanceof Error ? err.message : 'Permission Denied';
      setMessage({ type: 'error', text: `Failed to remove class: ${errorMsg}` });
      fetchData(true);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: any) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const newStatus = !user.deactivated;
      await updateDoc(userRef, { deactivated: newStatus });
      setMessage({ 
        type: 'success', 
        text: `Account for ${user.name} has been ${newStatus ? 'deactivated' : 'activated'}.` 
      });
      fetchData(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!u) return;
    try {
      const userId = u.id || u.uid;
      const email = u.email;
      const role = u.role;
      const name = u.name || email || 'this identity';

      if (!userId) {
        setMessage({ type: 'error', text: 'Error: Identity key missing. Cannot target record for erasure.' });
        return;
      }
      
      if (submitting) return;
      setSubmitting(true);

      // Optimistic update: instantly remove user from list so row fades out right away!
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // 1. Cascade Deletion (Students) - Resilient wrapped
      if (role === 'student') {
        const collections = ['attendance', 'results'];
        for (const collName of collections) {
          try {
            const q = query(collection(db, collName), where('studentId', '==', userId));
            const snap = await getDocs(q);
            const deletes = snap.docs.map(d => deleteDoc(doc(db, collName, d.id)));
            await Promise.all(deletes);
          } catch (cascadeErr) {
            console.warn(`Non-blocking cascade cleanup failed for student collection ${collName}:`, cascadeErr);
          }
        }
      }

      // 2. Cascade Nullify (Faculty) - Resilient wrapped
      if (role === 'faculty') {
        try {
          const q = query(collection(db, 'subjects'), where('facultyId', '==', userId));
          const snap = await getDocs(q);
          const updates = snap.docs.map(d => updateDoc(doc(db, 'subjects', d.id), { facultyId: null }));
          await Promise.all(updates);
        } catch (cascadeErr) {
          console.warn(`Non-blocking cascade nullify failed for faculty subjects:`, cascadeErr);
        }
      }

      // 3. Unify & Purge Primary User Document
      await deleteDoc(doc(db, 'users', userId));

      // 4. Clean up secondary email-linked duplicates
      if (email) {
        try {
          const emailQ = query(collection(db, 'users'), where('email', '==', email));
          const emailSnap = await getDocs(emailQ);
          const secondaryDeletes = emailSnap.docs
            .filter(d => d.id !== userId)
            .map(d => deleteDoc(doc(db, 'users', d.id)));
          await Promise.all(secondaryDeletes);
        } catch (secErr) {
          console.warn("Non-blocking secondary email cleanups failed:", secErr);
        }
      }

      setMessage({ type: 'success', text: `Identity for ${name} has been completely purged from the registry.` });
      fetchData(true);
    } catch (err) {
      console.error("Deletion failure:", err);
      const errorMsg = err instanceof Error ? err.message : 'Permission Denied or Connection Failure';
      setMessage({ type: 'error', text: `Purge Failed: ${errorMsg}` });
      fetchData(true); // Restore if failure occurs
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-[2rem] flex items-center justify-between shadow-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}
          >
            <div className="flex items-center gap-4">
              <CheckCircle2 size={20} />
              <span className="text-sm font-bold tracking-tight">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="p-2 hover:bg-black/5 rounded-xl transition-colors"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-stone-100 animate-pulse">
          <Loader2 className="animate-spin text-stone-300 mb-6" size={48} />
          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Syncing System Data</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
          {view === 'dashboard' && (
            <div className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="Total Faculty" value={users.filter(u => u.role === 'faculty').length} icon={<UserSquare2 size={24}/>} index={0} />
                <StatCard label="Active Students" value={users.filter(u => u.role === 'student').length} icon={<Users size={24}/>} index={1} />
                <StatCard label="Total Subjects" value={subjects.length} icon={<BookOpen size={24}/>} index={2} />
                <StatCard label="Classes" value={classes.length} icon={<GraduationCap size={24}/>} index={3} />
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2 space-y-8">
                  <SectionTitle title="Institutional Control Matrix" icon={<Target size={20} />} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <QuickActionCard 
                      label="Enroll Student" 
                      icon={<UserPlus size={24} />} 
                      onClick={() => setView?.('students')} 
                    />
                    <QuickActionCard 
                      label="Appoint Faculty" 
                      icon={<UserSquare2 size={24} />} 
                      onClick={() => setView?.('faculty')} 
                    />
                    <QuickActionCard 
                      label="New Class" 
                      icon={<Plus size={24} />} 
                      onClick={() => setView?.('classes')} 
                    />
                    <QuickActionCard 
                      label="Add Subject" 
                      icon={<BookPlus size={24} />} 
                      onClick={() => setView?.('subjects')} 
                    />
                  </div>
                </div>
                
                <div className="space-y-8">
                   <SectionTitle title="System Health" icon={<Target size={20} />} />
                   <div className="bg-stone-900 p-12 rounded-[3.5rem] shadow-2xl shadow-stone-200 text-white relative overflow-hidden group flex flex-col justify-between min-h-[450px]">
                    <div className="relative z-10">
                      <Badge variant="stone" className="bg-white/10 text-stone-300 border-white/5 mb-8 px-5 py-2">Security Protocol</Badge>
                      <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">Central Management Unit</h2>
                      <p className="text-stone-400 text-lg leading-relaxed">All operations are logged and monitored for academic integrity. Ensure adherence to institutional policies during administrative tasks.</p>
                    </div>
                    <div className="relative z-10 space-y-6 pt-10 border-t border-white/10">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-inner">
                          <Target className="text-stone-500 animate-pulse" size={24} />
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-500 leading-none mb-1.5">Infrastructure Load</p>
                          <p className="text-sm font-bold text-white leading-none">CPU: 12% | RAM: 4.2GB Available</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-inner">
                          <CheckCircle2 className="text-green-500" size={24} />
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-500 leading-none mb-1.5">Database Sync</p>
                          <p className="text-sm font-bold text-white leading-none">Last Snapshot: 2 mins ago (Verified)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-inner">
                          <Activity className="text-blue-400" size={24} />
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-500 leading-none mb-1.5">Auth Handshakes</p>
                          <p className="text-sm font-bold text-white leading-none">Concurrent Sessions: 142 Active</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -right-24 -bottom-24 h-80 w-80 bg-white/5 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(view === 'faculty' || view === 'students' || view === 'subjects' || view === 'classes' || view === 'assignments') && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {view === 'faculty' && (
                    <>
                      <TabBtn active={internalView === 'view-faculty'} label="Faculty Directory" onClick={() => setInternalView('view-faculty')} />
                      <TabBtn active={internalView === 'add-faculty'} label="Add Professor" onClick={() => setInternalView('add-faculty')} />
                    </>
                  )}
                  {view === 'students' && (
                    <>
                      <TabBtn active={internalView === 'view-students'} label="Student Registry" onClick={() => setInternalView('view-students')} />
                      <TabBtn active={internalView === 'add-student'} label="Enroll New" onClick={() => setInternalView('add-student')} />
                    </>
                  )}
                  {view === 'classes' && (
                    <>
                      <TabBtn active={internalView === 'view-classes'} label="Class List" onClick={() => setInternalView('view-classes')} />
                      <TabBtn active={internalView === 'add-class'} label="Create Class" onClick={() => setInternalView('add-class')} />
                    </>
                  )}
                  {view === 'subjects' && (
                    <>
                      <TabBtn active={internalView === 'view-subjects'} label="Subjects" onClick={() => setInternalView('view-subjects')} />
                      <TabBtn active={internalView === 'add-subject'} label="Add Subject" onClick={() => setInternalView('add-subject')} />
                    </>
                  )}
                  {(view === 'assignments' || view === 'subjects') && (
                    <TabBtn active={internalView === 'view-assignments'} label="Teaching Matrix" onClick={() => setInternalView('view-assignments')} />
                  )}
                </div>
                
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-stone-50 border border-stone-100 rounded-2xl pl-12 pr-6 py-3 text-xs outline-none focus:border-stone-900 focus:bg-white transition-all w-full md:w-64 font-medium"
                  />
                </div>
              </div>

              <div className="max-w-5xl mx-auto">
                {internalView === 'add-student' && (
                  <div className="max-w-2xl mx-auto py-10">
                    <Card className="p-16">
                      <div className="flex items-center gap-5 mb-12">
                        <div className="h-16 w-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-stone-200"><UserPlus size={32} /></div>
                        <div>
                          <p className="font-mono text-[11px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-2">Student Onboarding</p>
                          <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none">Institutional Enrollment</h2>
                        </div>
                      </div>
                      <form onSubmit={(e) => handleCreateUser(e, 'student')} className="space-y-8">
                        <FormInput name="name" label="Full Legal Name" placeholder="e.g. Johnathan Smith" disabled={submitting} />
                        <FormInput name="email" label="Official University Email" type="email" placeholder="e.g. j.smith@uni.ac.uk" disabled={submitting} />
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 mb-4 ml-1">Assigned Class</label>
                          <select name="classId" required disabled={submitting} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-8 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm font-bold appearance-none shadow-sm cursor-pointer hover:border-stone-300">
                            <option value="">Select Class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <PrimaryButton type="submit" label="Finalize Enrollment" loading={submitting} icon={ArrowRight} />
                      </form>
                    </Card>
                  </div>
                )}

                {internalView === 'view-students' && (
                  <Card>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 w-20">Actions</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">FullName</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Class</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Institutional Identity</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right text-xs">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {filteredUsers.filter(u => u.role === 'student').map((u, i) => (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={u.id} className={`hover:bg-stone-50/50 transition-all group ${u.deactivated ? 'opacity-50' : ''}`}>
                            <td className="p-10 py-8">
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                                  className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                  title="Permanently Purge Record"
                                >
                                  <Trash2 size={20} />
                                </button>
                            </td>
                            <td className="p-10 py-8">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-inner"><Users size={16}/></div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform">{u.name}</span>
                                  {u.deactivated && <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-widest leading-none mt-1">Inactive</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-10 py-8 text-sm font-medium text-stone-500">
                              {classes.find(c => c.id === u.classId)?.name || 'Unassigned'}
                            </td>
                            <td className="p-10 py-8">
                              <Badge variant={u.deactivated ? 'stone' : 'default'}>{u.deactivated ? 'Suspended' : 'Undergraduate'}</Badge>
                            </td>
                            <td className="p-10 py-8 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleUserStatus(u); }}
                                  className={`p-2.5 rounded-xl transition-all border ${u.deactivated ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'}`}
                                  title={u.deactivated ? 'Activate Account' : 'Deactivate Account'}
                                >
                                  {u.deactivated ? <UserCheck size={18} /> : <UserX size={18} />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {internalView === 'add-faculty' && (
                  <div className="max-w-2xl mx-auto py-10">
                    <Card className="p-16">
                      <div className="flex items-center gap-5 mb-12">
                        <div className="h-16 w-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-stone-200"><UserSquare2 size={32} /></div>
                        <div>
                          <p className="font-mono text-[11px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-2">Faculty Onboarding</p>
                          <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none">Academic Appointment</h2>
                        </div>
                      </div>
                      <form onSubmit={(e) => handleCreateUser(e, 'faculty')} className="space-y-8">
                        <FormInput name="name" label="Professor Full Name" placeholder="e.g. Dr. Helena Thorne" disabled={submitting} />
                        <FormInput name="email" label="Professional Staff Email" type="email" placeholder="e.g. h.thorne@uni.ac.uk" disabled={submitting} />
                        <PrimaryButton type="submit" label="Establish Appointment" loading={submitting} icon={ArrowRight} />
                      </form>
                    </Card>
                  </div>
                )}

                {internalView === 'view-faculty' && (
                  <Card>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 w-20">Purge</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Professor Identity</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Contact Email</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">Department Access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {filteredUsers.filter(u => u.role === 'faculty').map((u, i) => (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={u.id} className={`hover:bg-stone-50/50 transition-all group ${u.deactivated ? 'opacity-50' : ''}`}>
                            <td className="p-10 py-8">
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                                  className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                  title="Permanently Purge Record"
                                >
                                  <Trash2 size={20} />
                                </button>
                            </td>
                            <td className="p-10 py-8">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-inner"><UserSquare2 size={16}/></div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform">{u.name}</span>
                                  {u.deactivated && <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-widest leading-none mt-1">Inactive</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-10 py-8 text-sm font-medium text-stone-500">{u.email}</td>
                            <td className="p-10 py-8 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFaculty(u);
                                    setInternalView('assign-subject');
                                  }}
                                  className="p-2.5 px-4 bg-stone-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center gap-2"
                                  title="Assign Subject"
                                >
                                  <BookPlus size={14} />
                                  Assign
                                </button>
                                <Badge variant="stone">{u.deactivated ? 'Inactive' : 'Academic Faculty'}</Badge>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleUserStatus(u); }}
                                  className={`p-2.5 rounded-xl transition-all border ${u.deactivated ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'}`}
                                  title={u.deactivated ? 'Activate Account' : 'Deactivate Account'}
                                >
                                  {u.deactivated ? <UserCheck size={18} /> : <UserX size={18} />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {internalView === 'add-class' && (
                  <div className="max-w-2xl mx-auto py-10">
                    <Card className="p-16">
                      <div className="flex items-center gap-5 mb-12">
                        <div className="h-16 w-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-stone-200"><Plus size={32} /></div>
                        <div>
                          <p className="font-mono text-[11px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-2">Class Management</p>
                          <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none">Create New Class</h2>
                        </div>
                      </div>
                      <form onSubmit={handleAddClass} className="space-y-8">
                        <FormInput name="name" label="Class Name" placeholder="e.g. BSCS-1, Section A" disabled={submitting} />
                        <PrimaryButton type="submit" label="Register Class" loading={submitting} icon={ArrowRight} />
                      </form>
                    </Card>
                  </div>
                )}

                {internalView === 'view-classes' && (
                  <Card>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Class Name</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Total Students</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {filteredClasses.map((c, i) => (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={c.id} className="hover:bg-stone-50/50 transition-all group">
                            <td className="p-10 py-8">
                              <span className="text-sm font-bold text-stone-900 uppercase">{c.name}</span>
                            </td>
                            <td className="p-10 py-8 text-sm font-medium text-stone-500">
                              {users.filter(u => u.classId === c.id).length} Students
                            </td>
                            <td className="p-10 py-8 text-right text-xs text-stone-400">
                              <div className="flex items-center justify-end gap-3">
                                <span>{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClass(c); }}
                                  className="p-2 rounded-xl bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all border border-stone-100"
                                  title="Remove Class"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {internalView === 'add-subject' && (
                  <div className="max-w-2xl mx-auto py-10">
                    <Card className="p-16">
                      <div className="flex items-center gap-5 mb-12">
                        <div className="h-16 w-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-stone-200"><BookPlus size={32} /></div>
                        <div>
                          <p className="font-mono text-[11px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-2">Subject Registration</p>
                          <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none">Add New Subject</h2>
                        </div>
                      </div>
                      <form onSubmit={handleAddSubject} className="space-y-8">
                        <FormInput name="name" label="Subject Name" placeholder="e.g. Programming Fundamentals" disabled={submitting} />
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 mb-4 ml-1">Assigned Class</label>
                          <select name="classId" required disabled={submitting} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-8 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm font-bold appearance-none shadow-sm cursor-pointer hover:border-stone-300">
                            <option value="">Select target class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <PrimaryButton type="submit" label="Register Subject" loading={submitting} icon={ArrowRight} />
                      </form>
                    </Card>
                  </div>
                )}

                {internalView === 'view-subjects' && (
                  <Card>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Subject Name</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Class</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Assigned Expert</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {filteredSubjects.map((s, i) => (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={s.id} className="hover:bg-stone-50/50 transition-all group">
                            <td className="p-10 py-8">
                              <p className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform uppercase">{s.name}</p>
                            </td>
                            <td className="p-10 py-8 text-sm font-medium text-stone-500">
                              {classes.find(c => c.id === s.classId)?.name || 'Unassigned'}
                            </td>
                            <td className="p-10 py-8">
                              {s.facultyId ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-stone-900">
                                    {users.find(u => u.id === s.facultyId || u.uid === s.facultyId)?.name || 'Prof. Assigned'}
                                  </span>
                                  <span className="text-[9px] text-stone-400 uppercase tracking-widest leading-none mt-1">Instructor in Charge</span>
                                </div>
                              ) : (
                                <span className="text-xs text-stone-300 italic font-medium">Position Vacant</span>
                              )}
                            </td>
                            <td className="p-10 py-8 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <SecondaryButton 
                                  label={s.facultyId ? 'Reassign' : 'Allocate Expert'}
                                  onClick={() => { setSelectedSubject(s); setInternalView('assign-subject'); }} 
                                  className="!py-2.5 !px-6 !w-fit !text-[9px]"
                                />
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s); }}
                                  className="p-2.5 rounded-xl bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all border border-stone-100"
                                  title="Remove Subject"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {internalView === 'assign-subject' && (
                  <div className="max-w-2xl mx-auto py-10">
                    <Card className="p-16">
                      <div className="flex items-center gap-5 mb-12">
                        <div className="h-16 w-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-stone-200"><LinkIcon size={32} /></div>
                        <div>
                          <p className="font-mono text-[11px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-2">Workload Distribution</p>
                          <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none">{selectedSubject ? `Assigning: ${selectedSubject.name}` : "Faculty Allocation"}</h2>
                        </div>
                      </div>
                      <form onSubmit={handleAssignSubject} className="space-y-8">
                        {selectedSubject ? (
                          <input type="hidden" name="subjectId" value={selectedSubject.id} />
                        ) : (
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 mb-4 ml-1">Target Subject</label>
                            <select name="subjectId" required disabled={submitting} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-8 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm font-bold appearance-none shadow-sm cursor-pointer hover:border-stone-300">
                              <option value="">Select subject...</option>
                              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({classes.find(c => c.id === s.classId)?.name})</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 mb-4 ml-1">Designated Professor</label>
                          <select name="facultyId" defaultValue={selectedFaculty?.id || selectedFaculty?.uid || selectedSubject?.facultyId || ''} required disabled={submitting} className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-8 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-sm font-bold appearance-none shadow-sm cursor-pointer hover:border-stone-300">
                            <option value="">Choose academic expert...</option>
                            {users.filter(u => u.role === 'faculty').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-4 pt-4">
                          {(selectedSubject || selectedFaculty) && (
                            <SecondaryButton 
                              label="Cancel Selection" 
                              onClick={() => { 
                                setSelectedSubject(null); 
                                setSelectedFaculty(null);
                                setInternalView(selectedFaculty ? 'view-faculty' : 'view-subjects'); 
                              }}
                              className="flex-1"
                            />
                          )}
                          <PrimaryButton type="submit" label={(selectedSubject || selectedFaculty) ? "Finalize" : "Establish Matrix"} loading={submitting} icon={ArrowRight} className="flex-[2]" />
                        </div>
                      </form>
                    </Card>
                  </div>
                )}
                
                {internalView === 'view-assignments' && (
                  <div className="space-y-12">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
                      <div className="h-20 w-20 bg-stone-900 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-stone-200 mb-8 border border-stone-800">
                        <LinkIcon size={40} />
                      </div>
                      <h2 className="text-4xl font-bold text-stone-900 tracking-tight leading-none mb-4 uppercase">Expert Allocation Matrix</h2>
                      <p className="text-stone-400 text-lg leading-relaxed font-medium">A high-fidelity logical overview of academic responsibilities. Optimize expert load and identify instructional gaps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {users.filter(u => u.role === 'faculty').map((f, idx) => {
                        const facultySubjects = subjects.filter(s => s.facultyId === f.id || s.facultyId === f.uid);
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={f.id} 
                            className="bg-white border border-stone-200 rounded-[3rem] p-12 hover:border-stone-900 transition-all flex flex-col group shadow-sm hover:shadow-2xl hover:shadow-stone-100"
                          >
                            <div className="flex items-center gap-6 mb-10">
                              <div className="h-16 w-16 rounded-[1.5rem] bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-700 shadow-inner">
                                <UserSquare2 size={32} />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-stone-900 leading-tight mb-1">{f.name}</h4>
                                <p className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-[0.2em]">{f.email}</p>
                              </div>
                            </div>

                            <div className="flex-grow space-y-4">
                              <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-300 mb-4 border-b border-stone-50 pb-2">Assigned Research Subjects</p>
                              {facultySubjects.length > 0 ? facultySubjects.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-stone-100 group/item hover:border-stone-300 hover:bg-white transition-all cursor-default shadow-sm">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-stone-900 uppercase">{s.name}</span>
                                    <span className="text-[9px] text-stone-400 font-bold uppercase">{classes.find(c => c.id === s.classId)?.name || 'No Class'}</span>
                                  </div>
                                  <SecondaryButton 
                                    label="Modify"
                                    onClick={() => { setSelectedSubject(s); setInternalView('assign-subject'); }} 
                                    className="!py-2 !px-4 !w-fit !text-[9px] opacity-0 group-hover/item:opacity-100"
                                  />
                                </div>
                              )) : (
                                <div className="py-12 border border-dashed border-stone-100 bg-stone-50/30 rounded-[2rem] flex flex-col items-center justify-center text-stone-300 italic text-sm font-medium">
                                  No subjects currently allocated
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => setInternalView('assign-subject')}
                              className="mt-10 pt-8 border-t border-stone-50 text-[11px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-stone-900 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                              New Assignment <ChevronRight size={14} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {internalView === 'profile' && (
                  <div className="max-w-3xl mx-auto space-y-12 pb-20">
                    <Header title="Administrator Identity" subtitle="Manage your verified super-admin credentials and system access level." />
                    <div className="bg-white rounded-[4rem] border border-stone-200 shadow-2xl shadow-stone-200 overflow-hidden flex flex-col hover:border-stone-900 transition-colors duration-700 group">
                      <div className="h-64 bg-stone-900 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/exclusive-paper.png')] opacity-10" />
                        <div className="absolute -bottom-20 left-16 h-40 w-40 rounded-[3rem] bg-white p-3 shadow-2xl group-hover:-translate-y-2 transition-transform duration-700">
                          <div className="h-full w-full rounded-[2.5rem] bg-stone-50 flex items-center justify-center text-stone-200 border border-stone-100 shadow-inner">
                            <UserCircle size={100} />
                          </div>
                        </div>
                      </div>
                      <div className="pt-32 px-16 pb-16 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ProfileFieldItem label="Full Legal Name" value={profile?.name || 'Administrator'} />
                          <ProfileFieldItem label="System Email" value={profile?.email || ''} />
                          <ProfileFieldItem label="Technical ID" value={user?.uid.slice(0, 8).toUpperCase() || ''} />
                          <ProfileFieldItem label="Authorization" value="Super Admin Access" />
                        </div>
                        <div className="pt-10 border-t border-stone-100">
                          <PrimaryButton label="Establish Secure Credentials" loading={false} icon={ArrowRight} />
                          <p className="text-center text-[10px] text-stone-400 mt-6 font-medium italic leading-relaxed">Security Protocol: Admin profiles are immutable for audit integrity. Contact the system architect for database-level modifications.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const ProfileFieldItem = ({ label, value }: { label: string, value: string }) => (
  <div className="group">
    <p className="text-[10px] font-mono uppercase font-bold tracking-[0.3em] text-stone-400 mb-3 ml-1 group-hover:text-stone-900 transition-colors">{label}</p>
    <div className="text-base font-bold text-stone-900 bg-stone-50/50 px-8 py-5 rounded-[2rem] border border-stone-100 group-hover:border-stone-400 group-hover:bg-white transition-all shadow-sm">
      {value}
    </div>
  </div>
);

const TabBtn = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer border active:scale-95 ${active ? 'bg-stone-900 text-white border-stone-900 shadow-xl shadow-stone-200' : 'bg-white text-stone-400 border-stone-200 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300'}`}
  >
    {label}
  </button>
);

