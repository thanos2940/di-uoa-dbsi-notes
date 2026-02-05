# Module 05: Βασικοί Τελεστές & Σχεσιακή Άλγεβρα 🧮

**Προτεραιότητα:** 🟡 ΜΕΣΑΙΑ (Θεωρία + Σωστό/Λάθος) | **Εκτ. Χρόνος:** 1.0h

---

## 📚 Εισαγωγή: Από SQL σε Φυσικά Πλάνα

Όταν γράφουμε:

```sql
SELECT name FROM Students WHERE gpa > 3.5;
```

Το DBMS το μεταφράζει σε:

```
π_{name}(σ_{gpa>3.5}(Students))
```

Και μετά επιλέγει **φυσικούς αλγορίθμους** για κάθε τελεστή!

---

## 1. Σχεσιακή Άλγεβρα (Relational Algebra)

### 1.1 Βασικοί Τελεστές

#### 1. Επιλογή (Selection - σ)

**Φιλτράρισμα γραμμών** με βάση συνθήκη.

**Συμβολισμός:**

```
σ_{condition}(R)
```

**Παράδειγμα:**

```
σ_{age > 20}(Students)
σ_{department = 'CS' ∧ gpa > 3.5}(Students)
```

**SQL:**

```sql
SELECT * FROM Students WHERE age > 20;
```

#### 2. Προβολή (Projection - π)

**Επιλογή στηλών** (και αφαίρεση διπλοτύπων).

**Συμβολισμός:**

```
π_{A₁, A₂, ..., Aₙ}(R)
```

**Παράδειγμα:**

```
π_{name, gpa}(Students)
```

**SQL:**

```sql
SELECT DISTINCT name, gpa FROM Students;
```

> 💡 Το `DISTINCT` αντιστοιχεί στη θεωρητική προβολή (που αφαιρεί duplicates). Στην πράξη, χωρίς DISTINCT δεν αφαιρούνται.

#### 3. Καρτεσιανό Γινόμενο (Cartesian Product - ×)

**Όλοι οι πιθανοί συνδυασμοί** εγγραφών.

**Συμβολισμός:**

```
R × S
```

**Παράδειγμα:**

```
Students × Courses
Αν t(Students) = 100, t(Courses) = 50
→ t(R × S) = 100 × 50 = 5000
```

**SQL:**

```sql
SELECT * FROM Students, Courses;  -- Σπάνια χρήσιμο!
```

> ⚠️ Πολύ **ακριβό**! Χρησιμοποιείται ως βάση για ζεύξη.

#### 4. Ζεύξη (Join - ⋈)

**Καρτεσιανό + Επιλογή**.

**Θέσελ-Ζεύξη (Theta Join):**

```
R ⋈_{condition} S = σ_{condition}(R × S)
```

**Equi-Join (Ισότητα):**

```
R ⋈_{R.A = S.B} S
```

**Natural Join:**

```
R ⋈ S  [Ισότητα στα COMMON attributes]
```

**Παράδειγμα:**

```
Students ⋈_{Students.deptId = Departments.id} Departments
```

**SQL:**

```sql
SELECT * FROM Students S, Departments D 
WHERE S.deptId = D.id;

-- Ή:
SELECT * FROM Students NATURAL JOIN Departments;
```

#### 5. Συνολοθεωρητικοί

**Ένωση (Union - ∪):**

```
R ∪ S  [Όλες οι εγγραφές από R ή S, χωρίς duplicates]
```

**Τομή (Intersection - ∩):**

```
R ∩ S  [Κοινές εγγραφές]
```

**Διαφορά (Difference - -):**

```
R - S  [Εγγραφές στο R που ΔΕΝ είναι στο S]
```

**Προϋπόθεση:** **Union-compatible** (ίδιο schema).

**Παράδειγμα:**

```sql
SELECT name FROM CS_Students
UNION
SELECT name FROM Math_Students;
```

### 1.2 Αλγεβρικές Ιδιότητες (Για Σωστό/Λάθος!)

#### Αντιμεταθετικότητα

```
R ⋈ S = S ⋈ R  ✓
R ∪ S = S ∪ R  ✓
R ∩ S = S ∩ R  ✓
R - S ≠ S - R  ✗
```

#### Προσεταιριστικότητα

```
(R ⋈ S) ⋈ T = R ⋈ (S ⋈ T)  ✓
```

#### Push-down Selections (Σημαντικό για βελτιστοποίηση!)

```
σ_{θ}(R ⋈ S) = σ_{θ}(R) ⋈ S  [Αν το θ αφορά μόνο το R]
σ_{θ₁ ∧ θ₂}(R ⋈ S) = σ_{θ₁}(R) ⋈ σ_{θ₂}(S)  [Αν θ₁ αφορά R, θ₂ αφορά S]
```

**Παράδειγμα:**

```
ΠΡΙΝσ_{age > 20}(Students ⋈ Enrollments)

ΜΕΤΑ (καλύτερο):
σ_{age > 20}(Students) ⋈ Enrollments
```

> 💡 Φιλτράρουμε τον Students **πριν** τη ζεύξη → λιγότερες εγγραφές!

#### Διανομή της Προβολής

```
π_{A}(R ⋈ S) = π_{A}(π_{A∪B}(R) ⋈ π_{B∪C}(S))
όπου A, B = attributes χρειάζονται για join
```

---

## 2. Φυσικοί Τελεστές - Αλγόριθμοι

### 2.1 Table Scan (Σάρωση Πίνακα)

**Αλγόριθμος:**

```
for each page in Table:
    read page
    for each record in page:
        process record
```

**Κόστος:**

```
Cost = p(R)  [Διαβάζουμε όλα τα μπλοκ]
```

**Πότε χρησιμοποιείται:**

- Δεν υπάρχει index
- Range queries με μεγάλη επιλεκτικότητα (> 10-15%)

### 2.2 Index Scan (Σάρωση με Ευρετήριο)

**Αλγόριθμος:**

```
lookup index for startKey
scan sequentially until endKey
```

**Κόστος (range query):**

```
Cost = d(I) + [επιλεκτικότητα × cost_per_match]

Clustered: d(I) + matching_pages
Non-clustered: d(I) + matching_records  [χειρότερη περίπτωση]
```

### 2.3 Selection (Επιλογή)

#### Χωρίς Index

```
Cost = p(R)  [Full table scan]
```

#### Με Index (Equality)

**Clustered:**

```
Cost = d(I) + ⌈p(R) / V(A,R)⌉
```

**Non-clustered:**

```
Cost = d(I) + ⌈t(R) / V(A,R)⌉  [χειρότερη περίπτωση]
```

#### Με Index (Range)

**Παράδειγμα:**

```sql
SELECT * FROM Students WHERE age BETWEEN 20 AND 25;
```

**Clustered:**

- Βρες το 20 (cost = d(I))
- Sequential scan μέχρι 25
- Cost ≈ d(I) + [fraction × p(R)]

**Non-clustered:**

- Κάθε match → random I/O
- Συχνά **χειρότερο** από table scan!

### 2.4 Projection (Προβολή)

#### Χωρίς Duplicates (DISTINCT)

**Μέθοδοι:**

1. **Sort:** Ταξινόμηση + αφαίρεση διπλότυπων
   - Cost = Sort_cost + p(R)
2. **Hash:** Hashing + αφαίρεση
   - Cost ≈ 2×p(R)

#### Με Duplicates (Απλή προβολή)

```
Cost = p(R)  [Scan και επιλογή στηλών]
```

---

## 3. Μοντέλο Κόστους & Παραδοχές

### 3.1 Υποθέσεις (Assumptions)

#### Ομοιόμορφη Κατανομή (Uniformity)

```
P(A = v) = 1 / V(A,R)  [Κάθε τιμή εμφανίζεται το ίδιο συχνά]
```

**Παράδειγμα:**

```
V(gender, Students) = 2
→ P(gender = 'M') = 1/2
→ Εκτιμώμενες εγγραφές = t(Students) / 2
```

#### Ανεξαρτησία Πεδίων (Independence)

```
P(A = a ∧ B = b) = P(A = a) × P(B = b)
```

**Παράδειγμα:**

```
σ_{age > 20 ∧ gpa > 3.5}(Students)

Selectivity = (σ_{age>20}) × (σ_{gpa>3.5})
            = 0.6 × 0.3 = 0.18
```

> ⚠️ **Προσοχή:** Στην πράξη, τα πεδία συχνά **ΔΕΝ** είναι ανεξάρτητα!

### 3.2 Εκτίμηση Selectivity

**Equality (A = c):**

```
Selectivity = 1 / V(A,R)
```

**Range (A > c):**

```
Selectivity = (max(A) - c) / (max(A) - min(A))
```

**Conjunction (θ₁ ∧ θ₂):**

```
Selectivity = S(θ₁) × S(θ₂)
```

**Disjunction (θ₁ ∨ θ₂):**

```
Selectivity = S(θ₁) + S(θ₂) - S(θ₁) × S(θ₂)
```

### 3.3 Εκτίμηση Μεγέθους Αποτελέσματος

**Selection:**

```
t(σ_{θ}(R)) = t(R) × Selectivity(θ)
```

**Projection:**

```
t(π_A(R)) ≈ min(t(R), V(A,R))
```

**Join:**

```
t(R ⋈ S) ≈ t(R) × t(S) / max(V(A,R), V(B,S))
```

> 💡 Υποθέτουμε **inclusion dependency**: Κάθε τιμή του small domain ταιριάζει με large domain.

---

## 4. Στρατηγική Εξετάσεων

### 4.1 Σωστό/Λάθος - Συχνές Ερωτήσεις

**Ερώτηση 1:**
> "Η προβολή αφαιρεί πάντα duplicates."

**Απάντηση:** **ΛΑΘΟΣ** (στο SQL χωρίς DISTINCT δεν αφαιρούνται).

**Ερώτηση 2:**
> "σ_{θ}(R ⋈ S) = σ_{θ}(R) ⋈ S για οποιοδήποτε θ."

**Απάντηση:** **ΛΑΘΟΣ** (μόνο αν το θ αφορά πεδία του R).

**Ερώτηση 3:**
> "R ⋈ S = S ⋈ R"

**Απάντηση:** **ΣΩΣΤΟ** (η ζεύξη είναι αντιμεταθετική).

**Ερώτηση 4:**
> "R - S = S - R"

**Απάντηση:** **ΛΑΘΟΣ** (η αφαίρεση ΔΕΝ είναι αντιμεταθετική).

### 4.2 Υπολογισμοί Κόστους

**Παράδειγμα:**

```
Δίνονται:
- p(Students) = 500
- t(Students) = 50,000
- V(department, Students) = 10

Query: SELECT * FROM Students WHERE department = 'CS';
```

**Χωρίς Index:**

```
Cost = p(Students) = 500 I/Os
```

**Με Clustered Index:**

```
Cost = d(I) + ⌈500 / 10⌉ = 3 + 50 = 53 I/Os ✓
```

**Με Non-clustered Index:**

```
Cost = d(I) + ⌈50,000 / 10⌉ = 3 + 5,000 = 5,003 I/Os ✗
[Χειρότερο από table scan!]
```

---

## 5. Σύνοψη Τύπων

### Βασικοί Τελεστές

```
σ_{condition}(R)              [Selection]
π_{A₁, ..., Aₙ}(R)           [Projection]
R × S                         [Cartesian Product]
R ⋈_{condition} S             [Join]
R ∪ S, R ∩ S, R - S          [Set operations]
```

### Εκτίμηση Selectivity

```
Equality: 1 / V(A,R)
Range: (max - c) / (max - min)
Conjunction: S₁ × S₂
Disjunction: S₁ + S₂ - S₁×S₂
```

### Κόστος Βασικών Λειτουργιών

```
Table Scan: p(R)
Index Lookup (equality, clustered): d(I) + p(R)/V(A,R)
Index Lookup (equality, non-clustered): d(I) + t(R)/V(A,R)
```

---

## 📖 Βιβλιογραφία

- Ramakrishnan & Gehrke: Chapter 12
- Ιωαννίδης: Διαφάνειες ΥΣΒΔ 2024
- Ullman & Widom: "A First Course in Database Systems"

---

🎯 **Next Steps:**

1. Εξάσκησε τις αλγεβρικές ιδιότητες
2. Λύσε ασκήσεις κόστους με indices
3. Κατανόησε πότε index scan > table scan
4. Προχώρα στο Module 06 (Join Algorithms)
