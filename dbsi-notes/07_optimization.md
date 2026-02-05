# Module 07: Βελτιστοποίηση Ερωτημάτων 🎯

**Προτεραιότητα:** 🟡 ΜΕΣΑΙΑ (Θεωρία + Κατανόηση) | **Εκτ. Χρόνος:** 1.5h

---

## 📚 Εισαγωγή: Γιατί Βελτιστοποίηση

**Ερώτημα:**

```sql
SELECT S.name FROM Students S, Enrollments E, Courses C
WHERE S.id = E.student_id 
  AND E.course_id = C.id
  AND C.department = 'CS'
  AND S.gpa > 3.5;
```

**Πόσοι τρόποι εκτέλεσης υπάρχουν;**

- 3 πίνακες → 3! = 6 σειρές join (S⋈E⋈C, S⋈C⋈E, ...)
- Για κάθε join: 3-4 αλγόριθμοι (Nested Loop, Hash, Sort-Merge)
- Για κάθε σάρωση: Table scan ή Index scan

**Σύνολο:** Εκατοντάδες πιθανά πλάνα!

**Στόχος Optimizer:** Βρες το **φθηνότερο** (ή αρκετά καλό) πλάνο.

---

## 1. Χώροι Βελτιστοποίησης

### 1.1 Λογικός Χώρος (Algebraic Space)

**Ιδέα:** Χρησιμοποίησε αλγεβρικές ιδιότητες για να μετασχηματίσεις το query.

**Βασικοί Κανόνες:**

#### Push-down Selections

```
ΠΡΙΝ:
σ_{S.gpa > 3.5}(Students ⋈ Enrollments)

ΜΕΤΑ (καλύτερο):
σ_{gpa > 3.5}(Students) ⋈ Enrollments
```

**Λογική:** Φιλτράρουμε πρώτα → λιγότερες εγγραφές στη ζεύξη.

#### Push-down Projections

```
ΠΡΙΝ:
π_{name}(Students ⋈ Enrollments)

ΜΕΤΑ:
π_{name}(π_{id, name}(Students) ⋈ π_{student_id}(Enrollments))
```

**Λογική:** Κρατάμε μόνο τις στήλες που χρειαζόμαστε.

### 1.2 Φυσικός Χώρος (Physical Space)

**Για κάθε λογικό τελεστή, επιλέγουμε φυσικό αλγόριθμο:**

| Logical Op | Physical Algorithms |
|------------|-------------------|
| **Join** | Nested Loop, Hash Join, Sort-Merge |
| **Selection** | Table Scan, Index Scan |
| **Sort** | External Sort, Use existing index |

---

## 2. Πλάνα Εκτέλεσης (Query Plans)

### 2.1 Δέντρα Τελεστών

**Παράδειγμα:**

```
Query: SELECT * FROM R, S WHERE R.a = S.b AND R.c > 10
```

**Left-Deep Tree:**

```
      ⋈
     / \
    σ   S
    |
    R
```

**Bushy Tree:**

```
    ⋈
   / \
  σ   σ
  |   |
  R   S
```

**Πλεονέκτημα Left-Deep:**

- Επιτρέπει **pipelining**
- Μικρότερος χώρος αναζήτησης (εύκολο για optimizer)

### 2.2 Pipelining vs Materialization

#### Materialization

**Κάθε operator γράφει το αποτέλεσμά του σε προσωρινό δίσκο.**

```
R ⋈ S → [Temp1] → Temp1 ⋈ T → [Temp2] → ...
```

**Πλεονεκτήματα:**

- Απλό
- Ανθεκτικό (αν κρασάρει, μπορούμε να συνεχίσουμε)

**Μειονεκτήματα:**

- **Πολύ I/O** (write + read temporary results)

#### Pipelining (On-The-Fly)

**Τα tuples ρέουν από operator σε operator χωρίς να γραφτούν.**

```
R ⋈ S → (tuple stream) → Filter → (tuple stream) → Project
```

**Πλεονεκτήματα:**

- **0 I/O** για ενδιάμεσα
- Χαμηλότερο latency

**Μειονεκτήματα:**

- Όχι όλοι οι operators το υποστηρίζουν
- π.χ., Sort χρειάζεται όλα τα δεδομένα πρώτα (blocking operator)

**Πότε λειτουργεί;**

- Index Scan → ταξινομημένη έξοδος → μπορεί να τροφοδοτήσει Sort-Merge Join
- B+ Tree → sequential scan στα φύλλα → pipelined output

---

## 3. Εκτίμηση Μεγέθους & Κόστους

### 3.1 Στατιστικά Καταλόγου

**Το DBMS κρατάει:**

- $p(R)$: Αριθμός μπλοκ
- $t(R)$: Αριθμός εγγραφών
- $V(A, R)$: Διαφορετικές τιμές του A
- $min(A), max(A)$: Ελάχιστη/μέγιστη τιμή
- **Histograms:** Κατανομή τιμών (π.χ. equi-width, equi-depth)

### 3.2 Selectivity Estimation (Επανάληψη)

**Selection:**

```
σ_{A = c}(R):        Selectivity = 1 / V(A, R)
σ_{A > c}(R):        Selectivity = (max - c) / (max - min)
σ_{θ₁ ∧ θ₂}(R):      Selectivity = S(θ₁) × S(θ₂)  [independence]
```

**Join:**

```
t(R ⋈ S) = t(R) × t(S) / max(V(A,R), V(B,S))
```

**Υπόθεση:** Κάθε τιμή του μικρού domain ταιριάζει με μία του μεγάλου.

### 3.3 Εκτίμηση Κόστους Πλάνου

**Αλγόριθμος:**

1. Για κάθε operator, υπολόγισε εκτιμώμενο κόστος (από τώρα)
2. Προσωμετά τα κόστη από κάτω προς τα πάνω στο δέντρο

**Παράδειγμα:**

```
      π (Project)
      ↑
      ⋈ (Hash Join) → Cost = 3(p(R) + p(S)) + Cost_inputs
     / \
    R   S (Table Scans) → Cost_R = p(R), Cost_S = p(S)
```

---

## 4. Αλγόριθμος Αναζήτησης Πλάνου

### 4.1 Δυναμικός Προγραμματισμός (System R Style)

**Βασική Ιδέα:**

1. **Pass 1:** Βρες βέλτιστο πλάνο για κάθε **μεμονωμένο** πίνακα
2. **Pass 2:** Βρες βέλτιστο για κάθε **ζεύγος** πινάκων
3. **Pass k:** Βρες βέλτιστο για κάθε **υποσύνολο k πινάκων**
4. Συνέχισε μέχρι **N πίνακες**

**Πολυπλοκότητα:** $O(3^N)$ (εκθετική, αλλά υπάρχουν heuristics)

### 4.2 Pass 1: Single Relations

**Για κάθε πίνακα R:**

- **Option A:** Table Scan → Cost = p(R)
- **Option B:** Index Scan → Cost = d(I) + ...

**Κράτα:** Το φθηνότερο πλάνο.

### 4.3 Pass 2: Pairs of Relations

**Για κάθε ζεύγος {R, S}:**

- Δοκίμασε **R ⋈ S** και **S ⋈ R** (διαφορετική σειρά)
- Για κάθε σειρά, δοκίμασε:
  - Nested Loop (με διαφορετικό outer)
  - Hash Join
  - Sort-Merge

**Κράτα:** Το φθηνότερο για αυτό το ζεύγος.

### 4.4 Interesting Orders

**Πρόβλημα:** Ένα πλάνο μπορεί να είναι λίγο ακριβότερο **αλλά** να παράγει ταξινομημένο αποτέλεσμα.

**Παράδειγμα:**

```
πλάνο Α: Cost = 100, Output unsorted
Πλάνο Β: Cost = 120, Output sorted by id
```

Αν το query έχει `ORDER BY id`, το Β γλιτώνει το sort!

**Στρατηγική:**

- Κράτα **πολλαπλά πλάνα** για το ίδιο υποσύνολο
- Κάθε πλάνο με διαφορετικό "interesting order"

### 4.5 Heuristics (Για Μείωση Χώρου Αναζήτησης)

#### 1. Left-deep Trees Only

**Αντί για:** $(R ⋈ S) ⋈ (T ⋈ U)$ (bushy)  
**Μόνο:** $((R ⋈ S) ⋈ T) ⋈ U$ (left-deep)

**Πλεονέκτημα:**

- Πολύ μικρότερος χώρος αναζήτησης
- Pipelining-friendly

#### 2. Push Selections Early

**Πάντα** φιλτράρισε πρώτα.

#### 3. Greedy για Μικρά N

Αν N < 5, exhaustive search.  
Αν N ≥ 10, greedy heuristics (π.χ. join μικρότερους πρώτα).

---

## 5. Παράδειγμα Βήμα-Βήμα

**Query:**

```sql
SELECT * FROM R, S, T 
WHERE R.a = S.b AND S.c = T.d AND R.x > 10;
```

**Δεδομένα:**

- p(R) = 100, V(a, R) = 50
- p(S) = 200, V(b, S) = 50, V(c, S) = 100
- p(T) = 150, V(d, T) = 100

### Pass 1: Single Relations

```
R: Table Scan → 100
   σ_{x > 10}(R) → assume selectivity 0.5 → 50 pages ✓

S: Table Scan → 200 ✓

T: Table Scan → 150 ✓
```

### Pass 2: Pairs

```
{σ(R), S}:
  Option 1: σ(R) ⋈ S → Hash Join → 3(50 + 200) = 750

{σ(R), T}:
  Option 1: σ(R) ⋈ T → 3(50 + 150) = 600

{S, T}:
  Option 1: S ⋈ T → 3(200 + 150) = 1050
```

### Pass 3: All Three

```
Best από Pass 2: {σ(R), T} = 600

Τώρα join με S:
Cost ≈ 600 + Cost(⋈ S)
```

(Υπολογισμοί συνε χίζονται...)

---

## 6. Cost-based vs Rule-based

### Cost-based (Σύγχρονα DBMS)

- **Χρησιμοποιεί στατιστικά** για εκτίμηση
- **Διερευνά** πολλά πλάνα
- **Επιλέγει** το φθηνότερο

**Πλεονεκτήματα:** Adaptable, accurate  
**Μειονεκτήματα:** Αργό (για πολλούς πίνακες)

### Rule-based (Παλιά συστήματα)

- **Σταθεροί κανόνες** (π.χ. "πάντα χρησιμοποίησε index")
- Δεν κοιτάει στατιστικά

**Πλεονεκτήματα:** Γρήγορο  
**Μειονεκτήματα:** Μπορεί να διαλέξει κακό πλάνο

---

## 7. Πρακτικές Συμβουλές

### 7.1 Για Ασκήσεις

**Αν ρωτάνε "Ποια σειρά joins;":**

1. Φιλτράρισε πρώτα (push selections)
2. Join τους **μικρότερους** πίνακες πρώτα
3. Χρησιμοποίησε τύπους για εκτίμηση cardinality

### 7.2 Συχνές Παρανοήσεις

❌ **ΛΑΘΟΣ:** "Ο optimizer βρίσκει πάντα το **απολύτως** βέλτιστο"
✅ **ΣΩΣΤΟ:** Βρίσκει το καλύτερο στον **χώρο αναζήτησης** του (π.χ. left-deep only).

❌ **ΛΑΘΟΣ:** "Materialization πάντα κακό"
✅ **ΣΩΣΤΟ:** Μερικές φορές χρειάζεται (π.χ., για blocking operators).

---

## 8. Σύνοψη

### Χώροι Βελτιστοποίησης

```
Λογικός:  σ, π, ⋈ reordering (algebraic rules)
Φυσικός:  Algorithm selection (Nested Loop, Hash, ...)
```

### Πλάνα

```
Left-Deep Trees:  Pipelining-friendly, μικρός χώρος αναζήτησης
Bushy Trees:      Πιο γενικά, αλλά εκρηκτικός χώρος
```

### Αλγόριθμος

```
Dynamic Programming (System R):
  Pass 1: Single tables
  Pass 2: Pairs
  ...
  Pass N: All tables
```

### Interesting Orders

```
Διατήρηση πολλαπλών πλάνων με διαφορετική ταξινόμηση
```

---

## 📖 Βιβλιογραφία

- Ramakrishnan & Gehrke: Chapters 12-13
- Selinger et al.: "Access Path Selection in a Relational DBMS" (Original System R paper)
- Ιωαννίδης: Διαφάνειες ΥΣΒΔ 2024

---

🎯 **Next Steps:**

1. Κατανόησε τη διαφορά pipelining vs materialization
2. Εξάσκησε εκτιμήσεις selectivity και cardinality
3. Λύσε μια άσκηση DP για 3-4 πίνακες
4. Προχώρα στο Module 08-10 (Concurrency Control)
