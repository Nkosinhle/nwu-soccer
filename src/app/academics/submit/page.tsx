'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  code: string
  venue: string
  lecturer: string
}

interface Assessment {
  id: string
  type: 'class-test' | 'assignment' | 'exam' | 'practical'
  subject: string
  code: string
  date: string
  startTime: string
  endTime: string
  venue: string
  notes: string
  weight: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const YEAR = new Date().getFullYear()

let idCounter = 0
const newId = () => `tmp-${Date.now()}-${idCounter++}`

function emptySlot(): ClassSlot {
  return { id: newId(), day: 'Monday', startTime: '08:00', endTime: '09:00', subject: '', code: '', venue: '', lecturer: '' }
}

function emptyAssessment(): Assessment {
  return { id: newId(), type: 'class-test', subject: '', code: '', date: '', startTime: '09:00', endTime: '11:00', venue: '', notes: '', weight: '' }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {[1, 2].map(n => (
        <div key={n} className="flex items-center gap-3 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            n === step ? 'bg-[#4B2D83] text-white' : n < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {n < step ? '✓' : n}
          </div>
          <span className={`text-sm font-medium ${n === step ? 'text-[#4B2D83]' : 'text-gray-400'}`}>
            {n === 1 ? 'Class Timetable' : 'Assessment Timetable'}
          </span>
          {n === 1 && <div className="flex-1 h-px bg-gray-200" />}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubmitAcademicsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const initialSemester = Number(searchParams.get('semester') || 1)
  const initialYear     = Number(searchParams.get('year') || YEAR)

  const [step,     setStep]     = useState<1 | 2>(1)
  const [semester, setSemester] = useState(initialSemester)
  const [year,     setYear]     = useState(initialYear)
  const [slots,       setSlots]       = useState<ClassSlot[]>([emptySlot()])
  const [assessments, setAssessments] = useState<Assessment[]>([emptyAssessment()])
  const [savingSchedule,    setSavingSchedule]    = useState(false)
  const [savingAssessments, setSavingAssessments] = useState(false)
  const [scheduleSaved,    setScheduleSaved]    = useState(false)
  const [assessmentsSaved, setAssessmentsSaved] = useState(false)
  const [loadingExisting,  setLoadingExisting]  = useState(true)

  // Your User schema has a `playerId` field linking the account to its Player
  // document. Make sure your NextAuth session/jwt callbacks copy User.playerId
  // onto the token/session as `playerId` — this page can't resolve which
  // Player record to submit for otherwise.
  const playerId = (session?.user as { playerId?: string })?.playerId

  // Load existing submissions if present (so players can edit, not just create)
  const loadExisting = useCallback(async () => {
    if (!playerId) return
    setLoadingExisting(true)
    try {
      const [scheduleRes, assessmentRes] = await Promise.all([
        fetch(`/api/academics/schedule?playerId=${playerId}&semester=${semester}&year=${year}`),
        fetch(`/api/academics/assessments?playerId=${playerId}&semester=${semester}&year=${year}`),
      ])
      const scheduleData   = await scheduleRes.json()
      const assessmentData = await assessmentRes.json()

      const existingSchedule = scheduleData.schedules?.[0]
      if (existingSchedule?.slots?.length) {
        setSlots(existingSchedule.slots.map((s: Omit<ClassSlot, 'id'>) => ({ ...s, id: newId() })))
        setScheduleSaved(true)
      } else {
        setSlots([emptySlot()])
        setScheduleSaved(false)
      }

      const existingAssessments = assessmentData.assessments?.[0]
      if (existingAssessments?.assessments?.length) {
        setAssessments(existingAssessments.assessments.map((a: { date: string; weight?: number } & Omit<Assessment, 'id' | 'date' | 'weight'>) => ({
          ...a,
          id: newId(),
          date: a.date?.slice(0, 10) ?? '',
          weight: a.weight != null ? String(a.weight) : '',
        })))
        setAssessmentsSaved(true)
      } else {
        setAssessments([emptyAssessment()])
        setAssessmentsSaved(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingExisting(false)
    }
  }, [playerId, semester, year])

  useEffect(() => { loadExisting() }, [loadExisting])

  // ── Slot handlers ──
  function updateSlot(id: string, field: keyof ClassSlot, value: string) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }
  function addSlot() { setSlots(prev => [...prev, emptySlot()]) }
  function removeSlot(id: string) { setSlots(prev => prev.filter(s => s.id !== id)) }

  // ── Assessment handlers ──
  function updateAssessment(id: string, field: keyof Assessment, value: string) {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }
  function addAssessment() { setAssessments(prev => [...prev, emptyAssessment()]) }
  function removeAssessment(id: string) { setAssessments(prev => prev.filter(a => a.id !== id)) }

  // ── Validation ──
  const slotsValid = slots.every(s => s.subject && s.code && s.venue && s.startTime < s.endTime)
  const assessmentsValid = assessments.every(a => a.subject && a.code && a.date && a.venue && a.startTime < a.endTime)

  async function submitSchedule() {
    if (!slotsValid || !playerId) return
    setSavingSchedule(true)
    try {
      const res = await fetch('/api/academics/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId, semester, year,
          slots: slots.map(({ id, ...rest }) => rest),
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setScheduleSaved(true)
      setStep(2)
    } catch (err) {
      console.error(err)
      alert('Failed to save class timetable. Please try again.')
    } finally {
      setSavingSchedule(false)
    }
  }

  async function submitAssessments() {
    if (!assessmentsValid || !playerId) return
    setSavingAssessments(true)
    try {
      const res = await fetch('/api/academics/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId, semester, year,
          assessments: assessments.map(({ id, weight, ...rest }) => ({
            ...rest,
            weight: weight ? Number(weight) : undefined,
          })),
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setAssessmentsSaved(true)
    } catch (err) {
      console.error(err)
      alert('Failed to save assessment timetable. Please try again.')
    } finally {
      setSavingAssessments(false)
    }
  }

  // This form is player-only. Staff accounts (admin/coach/physio/support_staff)
  // typically have no linked Player record — show a clear message instead of
  // a broken form.
  if (session && !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">No player profile linked</h1>
          <p className="text-gray-500 text-sm">
            This account isn&apos;t linked to a player record, so there&apos;s no timetable to submit here.
            If you&apos;re a coach or admin wanting to submit on a player&apos;s behalf, use the player&apos;s row
            in the <Link href="/academics" className="text-[#4B2D83] underline">Academics overview</Link> instead.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#4B2D83] text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-purple-300 text-sm font-medium tracking-widest uppercase mb-1">NWU Soccer Institute</p>
          <h1 className="text-2xl md:text-3xl font-bold">Academic Timetable Submission</h1>
          <p className="text-purple-200 mt-1 text-sm">All players are required to submit their timetables each semester.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Semester / Year selector */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-600">Submitting for:</span>
          <select
            value={semester}
            onChange={e => setSemester(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
          >
            {[YEAR, YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {loadingExisting && <span className="text-xs text-gray-400 ml-auto">Loading existing submission…</span>}
        </div>

        <StepIndicator step={step} />

        {/* STEP 1: Class Schedule */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Weekly Class Schedule</h2>
              {scheduleSaved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">✓ Previously submitted</span>}
            </div>
            <p className="text-sm text-gray-500 mb-5">Add every class you attend this semester so the coaching staff can plan training around your timetable.</p>

            <div className="space-y-4">
              {slots.map((slot, idx) => (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-4 relative bg-gray-50/50">
                  {slots.length > 1 && (
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition"
                      aria-label="Remove class"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Class {idx + 1}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Module Name</label>
                      <input
                        value={slot.subject}
                        onChange={e => updateSlot(slot.id, 'subject', e.target.value)}
                        placeholder="e.g. Computer Science 211"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Module Code</label>
                      <input
                        value={slot.code}
                        onChange={e => updateSlot(slot.id, 'code', e.target.value.toUpperCase())}
                        placeholder="COMP211"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Day</label>
                      <select
                        value={slot.day}
                        onChange={e => updateSlot(slot.id, 'day', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Venue</label>
                      <input
                        value={slot.venue}
                        onChange={e => updateSlot(slot.id, 'venue', e.target.value)}
                        placeholder="e.g. F1 Lab 2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Lecturer</label>
                      <input
                        value={slot.lecturer}
                        onChange={e => updateSlot(slot.id, 'lecturer', e.target.value)}
                        placeholder="e.g. Dr. Mokoena"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                  </div>
                  {slot.startTime >= slot.endTime && (
                    <p className="text-xs text-red-500 mt-2">End time must be after start time.</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addSlot}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#4B2D83] font-medium hover:text-[#E8A020] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Add another class
            </button>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={submitSchedule}
                disabled={!slotsValid || savingSchedule}
                className="px-5 py-2.5 bg-[#4B2D83] text-white font-semibold rounded-lg hover:bg-[#3a2066] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSchedule ? 'Saving…' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Assessment Timetable */}
        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Assessment &amp; Exam Timetable</h2>
              {assessmentsSaved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">✓ Previously submitted</span>}
            </div>
            <p className="text-sm text-gray-500 mb-5">List every test, assignment due date, practical, and exam for this semester.</p>

            <div className="space-y-4">
              {assessments.map((a, idx) => (
                <div key={a.id} className="border border-gray-200 rounded-lg p-4 relative bg-gray-50/50">
                  {assessments.length > 1 && (
                    <button
                      onClick={() => removeAssessment(a.id)}
                      className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition"
                      aria-label="Remove assessment"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Assessment {idx + 1}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Type</label>
                      <select
                        value={a.type}
                        onChange={e => updateAssessment(a.id, 'type', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      >
                        <option value="class-test">Class Test</option>
                        <option value="assignment">Assignment</option>
                        <option value="practical">Practical</option>
                        <option value="exam">Exam</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs text-gray-500 block mb-1">Module Code</label>
                      <input
                        value={a.code}
                        onChange={e => updateAssessment(a.id, 'code', e.target.value.toUpperCase())}
                        placeholder="COMP211"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Module Name</label>
                      <input
                        value={a.subject}
                        onChange={e => updateAssessment(a.id, 'subject', e.target.value)}
                        placeholder="e.g. Computer Science 211"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Date</label>
                      <input
                        type="date"
                        value={a.date}
                        onChange={e => updateAssessment(a.id, 'date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Start Time</label>
                      <input
                        type="time"
                        value={a.startTime}
                        onChange={e => updateAssessment(a.id, 'startTime', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">End Time</label>
                      <input
                        type="time"
                        value={a.endTime}
                        onChange={e => updateAssessment(a.id, 'endTime', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Weight (%)</label>
                      <input
                        type="number"
                        min="0" max="100"
                        value={a.weight}
                        onChange={e => updateAssessment(a.id, 'weight', e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Venue</label>
                      <input
                        value={a.venue}
                        onChange={e => updateAssessment(a.id, 'venue', e.target.value)}
                        placeholder="e.g. Examination Hall A"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
                      <input
                        value={a.notes}
                        onChange={e => updateAssessment(a.id, 'notes', e.target.value)}
                        placeholder="Any extra detail"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
                      />
                    </div>
                  </div>
                  {a.startTime >= a.endTime && (
                    <p className="text-xs text-red-500 mt-2">End time must be after start time.</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addAssessment}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#4B2D83] font-medium hover:text-[#E8A020] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Add another assessment
            </button>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition"
              >
                ← Back
              </button>
              <button
                onClick={submitAssessments}
                disabled={!assessmentsValid || savingAssessments}
                className="px-5 py-2.5 bg-[#4B2D83] text-white font-semibold rounded-lg hover:bg-[#3a2066] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAssessments ? 'Saving…' : assessmentsSaved ? 'Update Submission' : 'Submit Timetable'}
              </button>
            </div>

            {assessmentsSaved && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                Your timetables for Semester {semester}, {year} are submitted. You'll get a confirmation email.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
