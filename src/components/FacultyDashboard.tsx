import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { 
  ClipboardCheck, 
  FileText, 
  CheckCircle2, 
  BookOpen,
  ArrowLeft,
  Loader2,
  Users,
  Activity,
  User,
  GraduationCap,
  CalendarDays,
  Target,
  UserCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestoreUtils';
import { 
  Header, 
  StatCard, 
  SectionTitle, 
  Card, 
  EmptyState, 
  PrimaryButton, 
  Badge,
  QuickActionCard,
  NoticeCard,
  SecondaryButton
} from './SharedComponents';

const LectureMiniCard = ({ time, subject, targetClass, room }: any) => (
  <div className="bg-white border border-stone-200/60 p-6 rounded-[2rem] shadow-sm hover:border-stone-900 transition-all group relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className="px-3 py-1 bg-stone-900 text-white text-[9px] font-mono font-bold rounded-lg tracking-widest">{time}</div>
      <Badge variant="stone">Confirmed</Badge>
    </div>
    <h4 className="font-bold text-stone-900 text-sm mb-1 group-hover:translate-x-1 transition-transform">{subject}</h4>
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-50">
      <div>
        <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none mb-1.5">Class</p>
        <p className="text-[10px] font-bold text-stone-900">{targetClass}</p>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none mb-1.5">Location</p>
        <p className="text-[10px] font-bold text-stone-900">{room}</p>
      </div>
    </div>
    <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-stone-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
  </div>
);

export const FacultyDashboard: React.FC<{ view: string, setView?: (v: string) => void }> = ({ view, setView }) => {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [resultsLogs, setResultsLogs] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Reset selected subject when view changes
  useEffect(() => {
    setSelectedSubject(null);
  }, [view]);

  const fetchAllData = async () => {
    try {
      const subjectsQ = query(collection(db, 'subjects'), where('facultyId', '==', user?.uid));
      const subjectsSnap = await getDocs(subjectsQ);
      const subjectsData = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsData);

      const classesSnap = await getDocs(collection(db, 'classes'));
      const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);

      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentsSnap = await getDocs(studentsQ);
      const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsData);

      const subjectIds = subjectsData.map(s => s.id);
      if (subjectIds.length > 0) {
        const attQ = query(collection(db, 'attendance'), where('subjectId', 'in', subjectIds.slice(0, 10)));
        const attSnap = await getDocs(attQ);
        setAttendanceLogs(attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const resQ = query(collection(db, 'results'), where('subjectId', 'in', subjectIds.slice(0, 10)));
        const resSnap = await getDocs(resQ);
        setResultsLogs(resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'faculty-dashboard-data');
    }
  };

  const handleAttendance = async (studentId: string, status: 'present' | 'absent') => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!selectedSubject?.id) return;
      await addDoc(collection(db, 'attendance'), {
        subjectId: selectedSubject.id,
        studentId,
        classId: selectedSubject.classId,
        status,
        date: serverTimestamp(),
      });
      setMessage({ type: 'success', text: `Attendance for ${getStudentName(studentId)} recorded.` });
      fetchAllData();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveResult = async (studentId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubject?.id || submitting) return;
    const formData = new FormData(e.currentTarget);
    const marks = Number(formData.get('marks'));

    setSubmitting(true);
    try {
      const q = query(
        collection(db, 'results'), 
        where('subjectId', '==', selectedSubject.id),
        where('studentId', '==', studentId),
        limit(1)
      );
      const snap = await getDocs(q);
      
      const resData = {
        subjectId: selectedSubject.id,
        studentId,
        marks,
        totalMarks: 100,
        updatedAt: serverTimestamp()
      };

      if (!snap.empty) {
        await setDoc(doc(db, 'results', snap.docs[0].id), resData, { merge: true });
      } else {
        await addDoc(collection(db, 'results'), resData);
      }
      setMessage({ type: 'success', text: "Academic results updated successfully." });
      fetchAllData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'results');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Subject';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Class';
  const getStudentName = (id: string) => students.find(s => s.id === id || s.uid === id)?.name || 'Student';

  const filteredStudentsForSubject = students.filter(s => s.classId === selectedSubject?.classId);

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
            <button onClick={() => setMessage(null)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ChevronRight size={18} className="rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-stone-100 animate-pulse">
          <Loader2 className="animate-spin text-stone-300 mb-6" size={48} />
          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Loading Academic Data</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
          {view === 'dashboard' && (
            <div className="space-y-16">
              <div className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-12 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-3">Academic Management Console</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-none mb-6">Welcome, {profile?.name}</h1>
                  <div className="flex items-center gap-4">
                    <Badge variant="stone">Active Session</Badge>
                    <span className="text-stone-400 text-base font-medium">{profile?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="h-24 w-24 rounded-[2rem] bg-stone-50 flex items-center justify-center text-stone-300 border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-all duration-700 shadow-inner group-hover:shadow-2xl">
                    <User size={48} />
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-64 bg-stone-50/30 -skew-x-12 translate-x-24 pointer-events-none group-hover:translate-x-12 transition-transform duration-1000" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="Assigned Subjects" value={subjects.length} icon={<BookOpen size={24}/>} index={0} />
                <StatCard label="Total Students" value={students.length} index={1} icon={<Users size={24} />} />
                <StatCard label="Attendance Logs" value={attendanceLogs.length} icon={<CalendarDays size={24}/>} index={2} />
                <StatCard label="Results Uploaded" value={resultsLogs.length} icon={<Target size={24}/>} index={3} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  <div className="space-y-8">
                    <SectionTitle title="Faculty Directives" icon={<Target size={20} />} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <QuickActionCard 
                        label="Log Attendance" 
                        icon={<ClipboardCheck size={24} />} 
                        onClick={() => setView?.('attendance')} 
                      />
                      <QuickActionCard 
                        label="Upload Results" 
                        icon={<Target size={24} />} 
                        onClick={() => setView?.('results')} 
                      />
                      <QuickActionCard 
                        label="View Subjects" 
                        icon={<BookOpen size={24} />} 
                        onClick={() => setView?.('subjects')} 
                      />
                      <QuickActionCard 
                        label="My Students" 
                        icon={<Users size={24} />} 
                        onClick={() => setView?.('students')} 
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionTitle title="Academic Activity Stream" icon={<Activity size={20} />} />
                    <Card className="divide-y divide-stone-100">
                      {attendanceLogs.slice(0, 4).map((att, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.1 }}
                          key={att.id} 
                          className="p-8 flex items-center justify-between hover:bg-stone-50/50 transition-all group"
                        >
                          <div className="flex items-center gap-6">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm border ${att.status === 'present' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              <ClipboardCheck size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform mb-1.5 leading-none">Attendance recorded for {getStudentName(att.studentId)}</p>
                              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none">{getSubjectName(att.subjectId)}</p>
                            </div>
                          </div>
                          <Badge variant={att.status === 'present' ? 'success' : 'danger'}>{att.status}</Badge>
                        </motion.div>
                      ))}
                      {resultsLogs.slice(0, 3).map((res, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: (attendanceLogs.length + i) * 0.1 }}
                          key={res.id} 
                          className="p-8 flex items-center justify-between hover:bg-stone-50/50 transition-all group"
                        >
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                              <Target size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform mb-1.5 leading-none">Numerical grade uploaded for {getStudentName(res.studentId)}</p>
                              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none">{getSubjectName(res.subjectId)}</p>
                            </div>
                          </div>
                          <span className="text-sm font-mono font-bold text-stone-900 bg-stone-100 px-5 py-2.5 rounded-2xl border border-stone-200">{res.marks}%</span>
                        </motion.div>
                      ))}
                      {(attendanceLogs.length === 0 && resultsLogs.length === 0) && (
                        <div className="p-20 text-center text-stone-300 italic text-sm">No recent activity found in records.</div>
                      )}
                    </Card>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-8">
                    <SectionTitle title="Official Notices" icon={<CalendarDays size={18} />} />
                    <div className="space-y-6">
                      <NoticeCard 
                        title="Internal Peer Review Cycle" 
                        date="MAY 15 2026" 
                        content="Faculty members are requested to complete the peer review for the submitted research journals by the end of this academic week. Submissions are available in the portal." 
                        category="Research"
                        index={0}
                      />
                      <NoticeCard 
                        title="Departmental Board of Studies" 
                        date="MAY 22 2026" 
                        content="The quarterly BOS meeting is scheduled for next Thursday. Agenda includes curriculum redesign for the upcoming fall semester and lab equipment procurement." 
                        category="Governance"
                        index={1}
                      />
                      <NoticeCard 
                        title="Grade Submission Deadline" 
                        date="JUNE 05 2026" 
                        content="Provisional grades for all undergraduate modules must be finalized and locked by 5:00 PM. No further extensions will be granted by the registry." 
                        category="Registry"
                        index={2}
                      />
                      <NoticeCard 
                        title="Faculty Development Program" 
                        date="JUNE 12 2026" 
                        content="A workshop on 'Active Learning Methodologies' will be conducted by visiting professors from Oxford. Registration is mandatory for junior faculty." 
                        category="Training"
                        index={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionTitle title="Subject Modules" icon={<BookOpen size={18} />} />
                    <div className="grid grid-cols-1 gap-5">
                      {subjects.map((s, i) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          key={s.id} 
                          className="bg-stone-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-48 shadow-2xl shadow-stone-200 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                        >
                          <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner relative z-10"><BookOpen size={24}/></div>
                          <div className="relative z-10">
                            <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-stone-500 mb-2">{getClassName(s.classId)}</p>
                            <h3 className="font-bold text-xl leading-tight tracking-tight group-hover:text-stone-300 transition-colors uppercase">{s.name}</h3>
                          </div>
                          <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        </motion.div>
                      ))}
                      {subjects.length === 0 && <EmptyState message="You currently have no active subject assignments." icon={<BookOpen size={40}/>} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'subjects' && (
            <div className="space-y-12">
              <Header title="Subject Assignments" subtitle="A consolidated view of all academic subjects under your instruction." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subjects.map((s, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    key={s.id} 
                    className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-sm hover:border-stone-900 transition-all flex flex-col gap-10 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="h-20 w-20 bg-stone-50 rounded-[2.5rem] flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all duration-700 border border-stone-100 shadow-inner">
                        <BookOpen size={36}/>
                      </div>
                      <Badge variant="stone">{getClassName(s.classId)}</Badge>
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-3xl tracking-tight leading-tight mb-8 whitespace-nowrap overflow-hidden text-ellipsis uppercase">{s.name}</h3>
                      <div className="flex items-center gap-6 pt-8 border-t border-stone-100">
                        <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-sm"><Users size={20}/></div>
                        <div>
                          <p className="text-[10px] font-mono uppercase text-stone-400 font-bold tracking-[0.2em] leading-none mb-1.5">Enrolled Pool</p>
                          <p className="text-sm font-bold text-stone-900">{students.filter(st => st.classId === s.classId).length} Undergraduates</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {subjects.length === 0 && <EmptyState message="No subjects detected in your academic curriculum." icon={<BookOpen size={40}/>} />}
              </div>
            </div>
          )}

          {(view === 'attendance' || view === 'results') && (
            <div className="max-w-5xl mx-auto space-y-12">
              <Header 
                title={view === 'attendance' ? 'Session Attendance' : 'Academic Grading'} 
                subtitle="Efficiently process student records through organized data entry interfaces." 
              />
              
              {!selectedSubject ? (
                <div className="grid gap-6">
                  {subjects.map((s, i) => (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      key={s.id} 
                      onClick={() => setSelectedSubject(s)}
                      className="flex items-center justify-between p-10 rounded-[3rem] bg-white border border-stone-200 hover:border-stone-900 transition-all group text-left shadow-sm hover:shadow-2xl hover:shadow-stone-200"
                    >
                      <div className="flex items-center gap-8">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-inner">
                          <BookOpen size={28} />
                        </div>
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-stone-400 mb-3 truncate max-w-[200px]">{getClassName(s.classId)}</p>
                          <h3 className="font-bold text-stone-900 text-2xl tracking-tight leading-none">{s.name}</h3>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-200 group-hover:text-stone-900 group-hover:border-stone-900 transition-all duration-500">
                        <ChevronRight size={24} />
                      </div>
                    </motion.button>
                  ))}
                  {subjects.length === 0 && <EmptyState message="No subjects available for data entry." icon={<BookOpen size={40}/>} />}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="flex items-center justify-between bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl shadow-stone-400 text-white border border-stone-800">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/10">
                        <GraduationCap size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase text-stone-500 font-bold tracking-[0.4em] mb-3">Active Target Subject</p>
                        <h2 className="text-2xl font-bold tracking-tight leading-none">{selectedSubject.name} <span className="text-stone-500 ml-2">({getClassName(selectedSubject.classId)})</span></h2>
                      </div>
                    </div>
                    <SecondaryButton 
                      label="Change Selection" 
                      onClick={() => setSelectedSubject(null)} 
                      icon={ArrowLeft}
                      className="!w-fit bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-white hover:border-white/20 !py-3 !px-6"
                    />
                  </div>

                  <Card>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Student Identity</th>
                          <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">
                            {view === 'attendance' ? 'Marking Logic' : 'Grade Input'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {filteredStudentsForSubject.map((s, i) => (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            key={s.id} 
                            className="hover:bg-stone-50/50 transition-all group"
                          >
                            <td className="p-10">
                              <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-sm"><Users size={20}/></div>
                                <div>
                                  <p className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform">{s.name}</p>
                                  <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-10 text-right">
                              {view === 'attendance' ? (
                                <div className="flex justify-end gap-3">
                                  <AttendanceBtn label="Present" color="green" disabled={submitting} onClick={() => handleAttendance(s.id, 'present')} />
                                  <AttendanceBtn label="Absent" color="red" disabled={submitting} onClick={() => handleAttendance(s.id, 'absent')} />
                                </div>
                              ) : (
                                <form onSubmit={(e) => handleSaveResult(s.id, e)} className="flex items-center justify-end gap-5">
                                  <div className="relative group">
                                    <input 
                                      name="marks" 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      placeholder="0" 
                                      disabled={submitting} 
                                      className="w-28 p-5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-bold font-mono text-stone-900 outline-none focus:ring-8 focus:ring-stone-900/5 focus:border-stone-900 transition-all text-center pr-12 hover:border-stone-400" 
                                      required 
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-stone-300 font-bold group-focus-within:text-stone-900 transition-colors">%</span>
                                  </div>
                                  <button type="submit" disabled={submitting} className="bg-stone-900 text-white h-16 w-16 flex items-center justify-center rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 group disabled:opacity-50">
                                    <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                                  </button>
                                </form>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </motion.div>
              )}
            </div>
          )}

          {view === 'students' && (
            <div className="space-y-10">
              <Header title="Student Registry" subtitle="A comprehensive architectural database of institutional undergraduate records." />
              <Card>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">FullName</th>
                      <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Class</th>
                      <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">Academic Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {students.map((s, i) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={s.id} 
                        className="hover:bg-stone-50/50 transition-all group"
                      >
                        <td className="p-10">
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100 shadow-inner group-hover:bg-stone-900 group-hover:text-white transition-all duration-700"><Users size={20}/></div>
                            <span className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform">{s.name}</span>
                          </div>
                        </td>
                        <td className="p-10 text-sm font-medium text-stone-500">
                          {getClassName(s.classId)}
                        </td>
                        <td className="p-10 text-right">
                          <Badge variant="default">Undergraduate</Badge>
                        </td>
                      </motion.tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-32 text-center text-stone-300 italic font-medium">No system records detected for the student registry.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-12">
              <Header title="Professional Identity" subtitle="Maintain and verify your academic portfolio and institutional credentials." />
              <div className="bg-white rounded-[4rem] border border-stone-200 shadow-2xl shadow-stone-200 overflow-hidden flex flex-col hover:border-stone-400 transition-colors duration-700 group">
                <div className="h-64 bg-stone-900 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                  <div className="absolute -bottom-20 left-16 h-40 w-40 rounded-[3rem] bg-white p-3 shadow-2xl group-hover:-translate-y-2 transition-transform duration-700">
                    <div className="h-full w-full rounded-[2.5rem] bg-stone-50 flex items-center justify-center text-stone-200 border border-stone-100 shadow-inner">
                      <UserCircle size={100} />
                    </div>
                  </div>
                </div>
                <div className="pt-32 px-16 pb-16 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ProfileFieldItem label="Full Name" value={profile?.name} />
                    <ProfileFieldItem label="Faculty Email" value={profile?.email} />
                    <ProfileFieldItem label="Professional ID" value={user?.uid.slice(0, 8).toUpperCase()} />
                    <ProfileFieldItem label="Institutional Rank" value="Senior Academic Faculty" />
                  </div>
                  <div className="pt-10 border-t border-stone-100">
                    <PrimaryButton label="Request Credential Update" loading={false} />
                    <p className="text-center text-[10px] text-stone-400 mt-6 font-medium italic">Security Protocol: Modifications require primary database administrator authorization.</p>
                  </div>
                </div>
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
    <div className="text-base font-bold text-stone-900 bg-stone-50/50 px-8 py-5 rounded-[2rem] border border-stone-100 group-hover:border-stone-300 group-hover:bg-white transition-all shadow-sm">
      {value}
    </div>
  </div>
);

const AttendanceBtn = ({ label, color, onClick, disabled }: any) => (
  <SecondaryButton 
    label={label}
    onClick={onClick}
    disabled={disabled}
    className={`!py-3 !px-8 !w-fit ${color === 'green' ? 'text-green-700 bg-green-50 border-green-100 hover:bg-stone-900 hover:text-white hover:border-stone-900' : 'text-red-700 bg-red-50 border-red-100 hover:bg-stone-900 hover:text-white hover:border-stone-900'}`}
  />
);
