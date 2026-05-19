# Security Specification: SmartUni Management System

## Data Invariants
- A user must have a valid role ('admin', 'faculty', 'student').
- Attendance and results must reference valid students and courses.
- Only admins can create/update courses and users.
- Faculty can only manage attendance and results for courses they are assigned to.
- Students can only see their own attendance and results.
- Timestamps must be server-generated.

## The Dirty Dozen Payloads (Target: DENY)
1. Unauthorized role escalation: User attempting to set `role: 'admin'`.
2. Spoofing attendance: Student trying to mark themselves 'present'.
3. Result tampering: Student trying to change their own grade.
4. Ghost Course: Creating a course without matching faculty ID.
5. Negative Marks: Entering -50 for a result.
6. Oversized ID: Creating a user with a 2KB string ID.
7. ID Poisoning: Adding non-alphanumeric characters to a course ID.
8. PII Leak: Unauthenticated user reading email addresses from `/users`.
9. Mass scraping: Student trying to `list` all results for a course.
10. Orphaned Attendance: Creating attendance for a non-existent course.
11. Immutable field change: Faculty trying to change `studentId` on an existing result.
12. Batch bypass: Creating a result without matching course validation.

## Implementation Plan
- Multi-tier rules based on `role` field in `/users/$(request.auth.uid)`.
- Use `isValidId()` for all path variables.
- Strict `affectedKeys()` for updates.
- Server timestamp validation for `createdAt` and `updatedAt` (if used).
