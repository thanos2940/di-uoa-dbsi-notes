# Build State

## Course
- Title: ΥΣΒΔ (k18) — Υλοποίηση Συστημάτων Βάσεων Δεδομένων · Πρόοδος
- Lang: el (technical terms in English)
- Goal: PASS
- Attribution: dated (badges only where backed by the Feb-2024 paper)
- Style: intuition-first, standard depth
- Source: slides 001-intro, 002-cache-fileorg, 003-indexing-gen, 004-AccessStructs, 005-ExternalSorting (Delis);
  whiteboard photos lec01/02/03/10; past paper ΥΣΒΔ 22-3-2024 (Ioannidis)
- Syllabus scope: πρόοδος = 001–005. Old pages (joins, optimization, concurrency) kept under old_index.html (not deleted).

## Phases
- [x] Phase 1 — Discovery (mode: ENHANCE → migrated to skill design; goal: PASS; exam material: yes)
- [x] Phase 1.5 — Exam mining (_build/exam_patterns.md)
- [x] Phase 2 — Plan approved by user (PASS, migrate, all syllabus)
- [x] Phase 3 — Scaffolding
- [x] Phase 4 — Chapters
- [x] Phase 5 — Exam prep (exam_prep.html + Exam Focus boxes + cram_sheet.html)
- [x] Phase 6 — Cross-chapter quiz (99 questions, 69 sections) + flashcards (6 decks)
- [x] Phase 7 — QA (qa-site.mjs: 0 errors; Playwright: no JS errors, no horizontal scroll at 390/1280)

## Chapters
| # | Source | File | Outline | HTML | Quiz | Reviewed |
|---|--------|------|---------|------|------|----------|
| 1 | 001-intro + lec01 | topic1_storage.html | ✅ | ✅ | ✅ | ✅ (single-agent pass) |
| 2 | 002 (part 1) + lec02 | topic2_buffer.html | ✅ | ✅ | ✅ | ✅ |
| 3 | 002 (part 2) + lec03 | topic3_files.html | ✅ | ✅ | ✅ | ✅ |
| 4 | 003 + lec10 + exam Q2 | topic4_indexing.html | ✅ | ✅ | ✅ | ✅ |
| 5 | 004 + exam Q1 | topic5_bplus.html | ✅ | ✅ | ✅ | ✅ |
| 6 | 005 | topic6_extsort.html | ✅ | ✅ | ✅ | ✅ |

## Simulators (js/sims/, verified with node against slide/exam examples)
- bptree.js — B+ insert/delete (Delis insert-8 / delete-20 examples, both 2024 exam trees, 1000 random invariant tests)
- buffer.js — FIFO/LRU/MRU/CLOCK/LRU-2 (whiteboard 10/8/6/6, LRU-2 slide victim f1)
- exthash.js — MSB extendible hashing (all 8 letter groups of the exam)
- extsort.js — passes table matches slide 7 exactly with ⌈N/B⌉

## Known fidelity notes
- Slide 4 (005) gives 2-way passes as ⌈log2(N/2)⌉; its own figure has 1+⌈log2 N⌉ — page explains both.
- Slide 5 (005) writes ⌈N/(B−1)⌉ initial runs; slide 7 table matches ⌈N/B⌉ — calculator shows both.
- Join-LRU model: shared pool of M frames, no output frame (assumption stated on the page).
- Extendible hashing is not in the 001–005 slides; included because it appeared in the 2024 paper (Tier 2).

## Next action
Optional: re-skin the archived pages (old_index.html, pages/part-b, pages/part-c) into topic pages for the final exam.
