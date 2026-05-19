import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../services/firestoreUtils';
import { 
  BookOpen, 
  ClipboardCheck, 
  FileText, 
  Loader2,
  Trophy,
  User,
  Activity,
  UserCircle,
  TrendingUp,
  Target,
  ArrowRight,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Header, 
  StatCard, 
  SectionTitle, 
  Card, 
  EmptyState, 
  Badge,
  QuickActionCard,
  NoticeCard,
  PrimaryButton,
  SecondaryButton
} from './SharedComponents';

const SessionMiniCard = ({ time, subject, room, faculty }: any) => (
  <div className="bg-white border border-stone-200/60 p-6 rounded-[2rem] shadow-sm hover:border-stone-400 transition-all group relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className="px-3 py-1 bg-stone-900 text-white text-[9px] font-mono font-bold rounded-lg tracking-widest">{time}</div>
      <Badge variant="stone">Active</Badge>
    </div>
    <h4 className="font-bold text-stone-900 text-sm mb-1 group-hover:translate-x-1 transition-transform">{subject}</h4>
    <p className="text-[10px] text-stone-400 font-medium mb-4">{room}</p>
    <div className="flex items-center gap-3 pt-4 border-t border-stone-50">
      <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-inner"><User size={14} /></div>
      <p className="text-[10px] font-bold text-stone-600">{faculty}</p>
    </div>
    <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-stone-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
  </div>
);

export const StudentDashboard: React.FC<{ view: string, setView?: (v: string) => void }> = ({ view, setView }) => {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchStudentData();
    }
  }, [user, profile]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Fetch classes to get the name of student's class
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);

      // Fetch subjects for student's class
      const subjectsQ = query(collection(db, 'subjects'), where('classId', '==', profile?.classId));
      const subjectsSnap = await getDocs(subjectsQ);
      const subjectsData = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsData);

      const facultySnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'faculty')));
      setFaculty(facultySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const attQuery = query(
        collection(db, 'attendance'), 
        where('studentId', '==', user?.uid),
        orderBy('date', 'desc')
      );
      const attSnap = await getDocs(attQuery);
      setAttendance(attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const resQuery = query(
        collection(db, 'results'), 
        where('studentId', '==', user?.uid),
        orderBy('updatedAt', 'desc')
      );
      const resSnap = await getDocs(resQuery);
      setResults(resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'student-dashboard-data');
    }
    setLoading(false);
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Subject';
  const getFacultyName = (facultyId: string) => faculty.find(f => f.id === facultyId || f.uid === facultyId)?.name || 'TBA';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Unassigned';
  
  const calculateGrade = (marks: number) => {
    if (marks >= 80) return 'A+';
    if (marks >= 70) return 'A';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    return 'F';
  };

  const totalResults = results.length;
  const passedSubjects = results.filter(r => r.marks >= 50).length;
  const averageMarks = totalResults > 0 ? (results.reduce((sum, r) => sum + (r.marks || 0), 0) / totalResults).toFixed(1) : '0';
  const attendanceRate = subjects.length > 0 ? Math.min(100, Math.round((attendance.length / (subjects.length * 10)) * 100)) : 0;

  return (
    <div className="space-y-12">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-stone-100 animate-pulse">
          <Loader2 className="animate-spin text-stone-300 mb-6" size={48} />
          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Syncing Academic Record</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
          {view === 'dashboard' && (
            <div className="space-y-16">
              <div className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-12 relative overflow-hidden group">
                <div className="relative z-10">
                  <Badge variant="stone" className="mb-6 px-5 py-2">Institutional Student Portal</Badge>
                  <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-none mb-8">Welcome Back, {profile?.name}</h1>
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge variant="success">{getClassName(profile?.classId)}</Badge>
                    <Badge variant="default">Spring Session 2026</Badge>
                    <span className="text-stone-400 text-base font-medium">{profile?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="h-32 w-32 rounded-[2.5rem] bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-200 group-hover:bg-stone-900 group-hover:text-white transition-all duration-1000 shadow-inner group-hover:shadow-2xl">
                    <User size={64} />
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-80 bg-stone-50/40 -skew-x-12 translate-x-32 pointer-events-none group-hover:translate-x-16 transition-transform duration-1000" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="Total Subjects" value={subjects.length} icon={<BookOpen size={24}/>} index={0} />
                <StatCard label="Live Attendance" value={`${attendanceRate}%`} icon={<ClipboardCheck size={24}/>} index={1} />
                <StatCard label="Subjects Passed" value={passedSubjects} icon={<Trophy size={24}/>} index={2} />
                <StatCard label="Academic Average" value={`${averageMarks}%`} icon={<TrendingUp size={24}/>} index={3} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  <div className="space-y-8">
                    <SectionTitle title="Today's Academic Sessions" icon={<CalendarDays size={20} />} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <SessionMiniCard 
                        time="09:00 - 10:30" 
                        subject="Advanced Data Structures" 
                        room="Lab 402 - Engineering Block"
                        faculty="Dr. Sarah Jenkins"
                      />
                      <SessionMiniCard 
                        time="11:00 - 12:30" 
                        subject="Machine Learning Fundamentals" 
                        room="Auditorium B"
                        faculty="Prof. Michael Ross"
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionTitle title="Student Utilities" icon={<Target size={20} />} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <QuickActionCard 
                        label="View Schedule" 
                        icon={<BookOpen size={24} />} 
                        onClick={() => setView?.('subjects')} 
                      />
                      <QuickActionCard 
                        label="Presence Log" 
                        icon={<ClipboardCheck size={24} />} 
                        onClick={() => setView?.('attendance')} 
                      />
                      <QuickActionCard 
                        label="Official Transcript" 
                        icon={<Trophy size={24} />} 
                        onClick={() => setView?.('results')} 
                      />
                      <QuickActionCard 
                        label="Update Profile" 
                        icon={<UserCircle size={24} />} 
                        onClick={() => setView?.('profile')} 
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionTitle title="Recent Institutional Activity" icon={<Activity size={20} />} />
                    <Card className="divide-y divide-stone-50">
                      {attendance.slice(0, 4).map((att, i) => (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={att.id} className="p-8 flex items-center justify-between hover:bg-stone-50/50 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm border ${att.status === 'present' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              <ClipboardCheck size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform mb-1.5 leading-none">Attendance recorded in {getSubjectName(att.subjectId)}</p>
                              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none">
                                {att.date?.toDate ? att.date.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Session Active'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={att.status === 'present' ? 'success' : 'danger'}>{att.status}</Badge>
                        </motion.div>
                      ))}
                      {results.slice(0, 3).map((res, i) => (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (attendance.length + i) * 0.1 }} key={res.id} className="p-8 flex items-center justify-between hover:bg-stone-50/50 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                              <Target size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900 group-hover:translate-x-1 transition-transform mb-1.5 leading-none">Academic assessment published: {getSubjectName(res.subjectId)}</p>
                              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none">Official Grades Internal</p>
                            </div>
                          </div>
                          <span className="text-sm font-mono font-bold text-stone-900 bg-stone-100 px-5 py-2.5 rounded-2xl border border-stone-200">{res.marks}%</span>
                        </motion.div>
                      ))}
                      {(attendance.length === 0 && results.length === 0) && (
                        <div className="p-20 text-center text-stone-300 italic text-sm font-medium">System reports zero recent activity.</div>
                      )}
                    </Card>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-8">
                    <SectionTitle title="Campus Board" icon={<TrendingUp size={18} />} />
                    <div className="space-y-6">
                      <NoticeCard 
                        title="Spring Mid-Term Assessment Schedule" 
                        date="MAY 15 2026" 
                        content="The official mid-term examination schedule for the Spring 2026 session has been published. Students are advised to verify their seating plans via the departmental notice board." 
                        category="Examination"
                        index={0}
                      />
                      <NoticeCard 
                        title="Annual Graduate Research Symposium" 
                        date="MAY 22 2026" 
                        content="Call for abstracts: Submissions for the institutional research symposium are now open. Undergraduate students are encouraged to present their final year projects." 
                        category="Research"
                        index={1}
                      />
                      <NoticeCard 
                        title="Digital Library Resource Expansion" 
                        date="MAY 25 2026" 
                        content="Institutional access to IEEE Explorer and ACM Digital Library has been renewed. Remote access is available through the university VPN." 
                        category="Academic"
                        index={2}
                      />
                      <NoticeCard 
                        title="Sustainability Campus Initiative" 
                        date="JUNE 02 2026" 
                        content="Join the green campus drive this Friday. The university is transitioning to zero-single-use plastics across all cafeterias and common areas." 
                        category="Events"
                        index={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionTitle title="Subject Distribution" icon={<BookOpen size={18} />} />
                    <div className="grid grid-cols-1 gap-5">
                      {subjects.slice(0, 3).map((s, i) => (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={s.id} className="bg-stone-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-48 shadow-2xl shadow-stone-300 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                          <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner relative z-10"><BookOpen size={24}/></div>
                          <div className="relative z-10">
                            <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-stone-500 mb-2 truncate">{getClassName(s.classId)}</p>
                            <h3 className="font-bold text-xl leading-tight uppercase group-hover:text-stone-300 transition-colors">{s.name}</h3>
                          </div>
                          <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        </motion.div>
                      ))}
                      <SecondaryButton 
                        label="View All Modules" 
                        onClick={() => setView?.('subjects')} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'subjects' && (
            <div className="space-y-12">
              <Header title="My Academic Curriculum" subtitle="A verified registry of your professional training modules and departmental instructors." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {subjects.map((s, i) => (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }} key={s.id} className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-sm hover:border-stone-900 transition-all flex flex-col gap-10 group">
                    <div className="flex justify-between items-start">
                      <div className="h-20 w-20 bg-stone-50 rounded-[2.5rem] flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all duration-700 border border-stone-100 shadow-inner">
                        <BookOpen size={36}/>
                      </div>
                      <Badge variant="stone">{getClassName(s.classId)}</Badge>
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-3xl tracking-tight leading-tight mb-8 uppercase line-clamp-2">{s.name}</h3>
                      <div className="flex items-center gap-6 pt-8 border-t border-stone-100">
                        <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 border border-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-sm"><User size={20}/></div>
                        <div>
                          <p className="text-[10px] font-mono uppercase text-stone-400 font-bold tracking-[0.3em] leading-none mb-2">Lead Instructor</p>
                          <p className="text-base font-bold text-stone-900 leading-none">{getFacultyName(s.facultyId)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {subjects.length === 0 && <EmptyState message="No modules found in your current curriculum." icon={<BookOpen size={40}/>} />}
              </div>
            </div>
          )}

          {view === 'attendance' && (
            <div className="max-w-5xl mx-auto space-y-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                <Header title="Institutional Presence" subtitle="A chronological log of your session attendance and lecture engagement." />
                <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] flex flex-col items-center justify-center shadow-2xl shadow-stone-400 min-w-[300px] border border-stone-800 relative overflow-hidden group">
                  <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-500 mb-4 relative z-10 text-center">Engagement Rate</p>
                  <p className="text-7xl font-bold tracking-tighter relative z-10">{attendanceRate}%</p>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20 pointer-events-none" />
                  <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                </div>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Timestamp Log</th>
                        <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Target Module</th>
                        <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {attendance.map((att, i) => (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} key={att.id} className="hover:bg-stone-50/50 transition-all group">
                          <td className="p-10 text-sm font-bold text-stone-900">
                            {att.date?.toDate ? att.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : 'Verification Pending'}
                          </td>
                          <td className="p-10 text-sm text-stone-500 font-medium uppercase tracking-tight">{getSubjectName(att.subjectId)}</td>
                          <td className="p-10 text-right">
                            <Badge variant={att.status === 'present' ? 'success' : 'danger'}>{att.status}</Badge>
                          </td>
                        </motion.tr>
                      ))}
                      {attendance.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-40 text-center text-stone-300 italic font-medium">No presence records matching this identity were detected.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {view === 'results' && (
            <div className="max-w-5xl mx-auto space-y-16">
              <Header title="Academic Transcript" subtitle="Authentication of numerical assessment results and institutional grading certifications." />
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Module Nomenclature</th>
                        <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-center">Performance Scale</th>
                        <th className="p-10 font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 text-right">Certified Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {results.map((res, i) => (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={res.id} className="hover:bg-stone-50/50 transition-all group">
                          <td className="p-10">
                            <p className="text-sm font-bold text-stone-900 uppercase mb-2">{getSubjectName(res.subjectId)}</p>
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{res.updatedAt?.toDate ? res.updatedAt.toDate().toLocaleDateString() : 'Official Publication'}</p>
                          </td>
                          <td className="p-10 text-center">
                            <div className="inline-flex items-center font-mono text-sm font-bold p-5 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner group-hover:bg-stone-900 group-hover:text-white transition-all duration-500">
                              <span className="group-hover:text-white">{res.marks}</span>
                              <span className="text-stone-300 mx-3 font-light">/</span>
                              <span className="text-stone-400 group-hover:text-stone-500">100</span>
                            </div>
                          </td>
                          <td className="p-10 text-right">
                            <span className="text-5xl font-bold text-stone-900 font-serif italic tracking-tighter group-hover:translate-x-1 transition-transform inline-block">{calculateGrade(res.marks)}</span>
                          </td>
                        </motion.tr>
                      ))}
                      {results.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-40 text-center text-stone-300 italic text-sm font-medium whitespace-pre-wrap leading-relaxed">Results are currently undergoing administrative verification. Publication pending.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {results.length > 0 && (
                  <div className="p-20 bg-stone-900 text-white flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden group">
                    <div className="flex items-center gap-10 relative z-10">
                      <div className="h-32 w-32 bg-white/10 rounded-[3rem] flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-1000"><Trophy className="text-amber-400" size={64}/></div>
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-[0.5em] text-stone-500 mb-4">Institutional Achievement</p>
                        <h3 className="text-5xl font-bold tracking-tight uppercase leading-none">Consolidated Marksheet</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-16 relative z-10 bg-white/5 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/5 border-dashed">
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-4">Weighted Average</p>
                        <p className="text-6xl font-bold tracking-tighter">{averageMarks}%</p>
                      </div>
                      <div className="w-px h-24 bg-white/10" />
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-4">Cumulative Merit</p>
                        <p className="text-6xl font-bold tracking-tighter">{results.reduce((a, b) => a + b.marks, 0)} <span className="text-stone-600 text-xl font-medium tracking-normal ml-1">/ {results.length * 100}</span></p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  </div>
                )}
              </Card>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-16 pb-20">
              <Header title="My Student Profile" subtitle="Manage your officially verified institutional identity and professional credentials." />
              <div className="bg-white rounded-[4rem] border border-stone-200 shadow-2xl shadow-stone-200 overflow-hidden flex flex-col hover:border-stone-400 transition-all duration-700 group">
                <div className="h-64 bg-stone-900 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/exclusive-paper.png')] opacity-20" />
                  <div className="absolute -bottom-20 left-16 h-40 w-40 rounded-[3rem] bg-white p-3 shadow-2xl group-hover:-translate-y-2 transition-transform duration-700">
                    <div className="h-full w-full rounded-[2.5rem] bg-stone-50 flex items-center justify-center text-stone-200 border border-stone-100 shadow-inner">
                      <UserCircle size={100} />
                    </div>
                  </div>
                </div>
                <div className="pt-32 px-16 pb-16 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ProfileFieldItem label="Full Legal Name" value={profile?.name} />
                    <ProfileFieldItem label="University Email" value={profile?.email} />
                    <ProfileFieldItem label="Institutional Identity" value={user?.uid.slice(0, 8).toUpperCase()} />
                    <ProfileFieldItem label="Portal Clearance" value="Verified Student" />
                  </div>
                  <div className="pt-10 border-t border-stone-100 flex flex-col items-center gap-8">
                    <PrimaryButton 
                      label="Update Profile Information" 
                      loading={false} 
                      icon={ArrowRight}
                      onClick={() => {}}
                    />
                    <p className="text-center text-[10px] text-stone-400 font-medium italic max-w-sm leading-relaxed">Security Notice: Authenticated changes require cryptographic secondary verification by the registry department.</p>
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
    <div className="text-base font-bold text-stone-900 bg-stone-50/50 px-8 py-5 rounded-[2rem] border border-stone-100 group-hover:border-stone-400 group-hover:bg-white transition-all shadow-sm">
      {value}
    </div>
  </div>
);
