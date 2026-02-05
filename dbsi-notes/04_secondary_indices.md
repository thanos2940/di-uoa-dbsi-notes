# Module 04: Δευτερεύοντα Ευρετήρια 🗂️

**Προτεραιότητα:** 🟢 ΧΑΜΗΛΗ (Θεωρία & Trade-offs) | **Εκτ. Χρόνος:** 0.5h

---

## 📚 Εισαγωγή: Γιατί Πολλαπλά Ευρετήρια

Έστω ότι έχουμε πίνακα Students:

```sql
CREATE TABLE Students (
    id INT PRIMARY KEY,     -- Πρωτεύον κλειδί
    name VARCHAR(50),
    department VARCHAR(20),
    gpa FLOAT
);
```

**Ερώτημα 1:**

```sql
SELECT * FROM Students WHERE id = 12345;  -- Πολύ γρήγορο (primary key)
```

**Ερώτηση 2:**

```sql
SELECT * FROM Students WHERE department = 'CS';  -- Πολύ αργό χωρίς index!
```

**Λύση:** Δημιουργούμε **δευτερεύον ευρετήριο** στο `department`!

---

## 1. Πρωτεύον vs Δευτερεύον Ευρετήριο

### 1.1 Πρωτεύον Ευρετήριο (Primary/Clustered Index)

**Ορισμός:** Ευρετήριο που **καθορίζει τη φυσική διάταξη** των δεδομένων στο δίσκο.

**Χαρακτηριστικά:**

- **Μόνο ΕΝΑ** ανά πίνακα (γιατί τα δεδομένα μπορούν να είναι ταξινομημένα με έναν μόνο τρόπο)
- Συνήθως πάνω στο **Primary Key**
- Τα **δεδομένα** είναι στα **φύλλα** του δέντρου (π.χ. B+ Tree)

**Παράδειγμα:**

```
B+ Tree στο id:
        [50]
       /    \
  [10,30]  [60,80]
   /  |     |    \
[Data] [Data] [Data] [Data]
  ↑      ↑      ↑      ↑
Πραγματικές εγγραφές (ταξινομημένες κατά id)
```

**Πλεονεκτήματα:**

- **Range queries πολύ γρήγορα** (sequential scan στα φύλλα)
- Κάθε matching record → 1 συνεχόμενο μπλοκ

### 1.2 Δευτερεύον Ευρετήριο (Secondary/Non-clustered Index)

**Ορισμός:** Ευρετήριο που **ΔΕΝ** καθορίζει τη φυσική διάταξη.

**Χαρακτηριστικά:**

- **Πολλά** ανά πίνακα (όσα θέλουμε!)
- Τα φύλλα περιέχουν **δείκτες** (pointers) στα δεδομένα, όχι τα ίδια τα δεδομένα
- Συνήθως πάνω σε **μη-κλειδί πεδία** (π.χ. department, name)

**Παράδειγμα:**

```
B+ Tree στο department:
      ['EE', 'ME']
      /    |      \
  ['CS'] ['EE'] ['ME']
   /       |       \
[RID₁] [RID₃]  [RID₅]  ← Row IDs (pointers)
[RID₂] [RID₇]  [RID₉]
```

**RID (Row ID):** Δείκτης στην πραγματική εγγραφή (π.χ. PageID + SlotID).

---

## 2. Δομή Δευτερεύοντος Ευρετηρίου

### 2.1 Τύποι Δεικτών

#### Option 1: Direct Row ID (RID)

```
Index Entry: (Key=CS, RID=Page5:Slot3)
             ↓
         Στον δίσκο Page 5, Slot 3 → εγγραφή
```

**Πλεονεκτήματα:**

- Άμεση πρόσβαση

**Μειονεκτήματα:**

- Αν η εγγραφή μετακινηθεί (π.χ. update), πρέπει να ενημερώσουμε το index

#### Option 2: Primary Key Pointer

```
Index Entry: (Key=CS, PK=12345)
             ↓
    Primary Index: 12345 → Page 10, Slot 2 → εγγραφή
```

**Πλεονεκτήματα:**

- Ανθεκτικό σε μετακινήσεις εγγραφών

**Μειονεκτήματα:**

- Ένα επιπλέον lookup (μέσω primary index)

### 2.2 Πυκνό vs Αραιό Ευρετήριο

#### Πυκνό (Dense)

**Μία εγγραφή ευρετηρίου για ΚΑΘΕ εγγραφή δεδομένων.**

```
Data:  [r₁, r₂, r₃, r₄, r₅]
Index: [k₁, k₂, k₃, k₄, k₅]
```

**Δευτερεύοντα ευρετήρια είναι ΠΑΝΤΑ πυκνά!**

#### Αραιό (Sparse)

**Μία εγγραφή ευρετηρίου ανά μπλοκ (όχι ανά εγγραφή).**

```
Data:  Block1[r₁r₂r₃] Block2[r₄r₅r₆] Block3[r₇r₈r₉]
Index: [k₁] [k₄] [k₇]
       ↓    ↓    ↓
      B1   B2   B3
```

**Μόνο πρωτεύοντα (clustered) μπορούν να είναι αραιά.**

---

## 3. Κόστος Αναζήτησης

### 3.1 Πρωτεύον (Clustered) Index

**Ισότητα (A = c):**

```
Cost = d(I) + ⌈p(R) / V(A,R)⌉
```

**Εξήγηση:**

- $d(I)$: κόστος κάθοδου στο δέντρο
- $p(R) / V(A,R)$: εκτιμώμενα μπλοκ με matches
  - Αν uniformly distributed: $t(R) / V(A,R)$ εγγραφές
  - Αυτές είναι συνεχείς → $\approx$ τόσα μπλοκ

**Παράδειγμα:**

```
p(Students) = 1000
V(department, Students) = 10
d(I) = 3

Cost = 3 + ⌈1000/10⌉ = 3 + 100 = 103 I/Os
```

### 3.2 Δευτερεύον (Non-clustered) Index

**Ισότητα (A = c):**

```
Cost = d(I) + t(R) / V(A,R)
```

**Χειρότερη περίπτωση:**

```
Cost = d(I) + t(R) / V(A,R)  [Κάθε RID → διαφορετικό μπλοκ!]
```

**Παράδειγμα (ίδια δεδομένα):**

```
t(Students) = 100,000
V(department, Students) = 10
d(I) = 3

Cost = 3 + 100,000/10 = 3 + 10,000 = 10,003 I/Os ❗
```

> 💡 **Σημαντικό:** Δευτερεύον index μπορεί να είναι **χειρότερο** από full table scan (1000 I/Os) αν η επιλεκτικότητα είναι χαμηλή!

### 3.3 Range Queries

**Clustered:**

```sql
SELECT * FROM Students WHERE id BETWEEN 1000 AND 2000;
```

- Βρες το 1000 → σάρωσε sequential μέχρι 2000
- **Πολύ γρήγορο** ✓

**Non-clustered:**

```sql
SELECT * FROM Students WHERE gpa BETWEEN 3.5 AND 4.0;
```

- Βρες το 3.5 → για κάθε RID → random access
- **Πολύ αργό** ✗

> ⚠️ **Συμβουλή Optimizer:** Αν το range καλύπτει > 10-15% του πίνακα, κάνε **Table Scan** αντί για non-clustered index scan!

---

## 4. Κόστος Ενημερώσεων

### 4.1 Insert

**Χωρίς δευτερεύοντα:**

```
Cost_insert = Cost(βρες θέση) + 1  [εγγραφή του record]
```

**Με k δευτερεύοντα:**

```
Cost_insert = Cost(βρες θέση) + 1 + k × d(I_secondary)
```

**Παράδειγμα:**

```
3 δευτερεύοντα ευρετήρια, καθένα βάθους 3:
Extra cost = 3 × 3 = 9 I/Os ανά insert!
```

### 4.2 Delete

**Ανάλογα με Insert:**

```
Cost_delete = Cost(βρες εγγραφή) + 1 + k × d(I_secondary)
```

### 4.3 Update

**Εξαρτάται αν το update αλλάζει indexed columns:**

- **Αλλάζει μη-indexed πεδίο** (π.χ. gpa):

  ```
  Cost = Find + 1 (modify)
  ```

- **Αλλάζει indexed πεδίο** (π.χ. department):

  ```
  Cost = Find + 1 + Σ(d(affected_indexes))
  ```

**Παράδειγμα:**

```sql
UPDATE Students SET department = 'CS' WHERE id = 12345;
```

- Πρέπει να ενημερώσουμε το δευτερεύον index στο department
- Extra cost = d(I_department)

---

## 5. Επιλογή Ευρετηρίων - Trade-offs

### 5.1 Πότε να Δημιουργήσουμε Δευτερεύον

✅ **Δημιούργησε αν:**

- Το πεδίο χρησιμοποιείται **συχνά** στα WHERE clauses
- Η επιλεκτικότητα είναι **υψηλή** (π.χ. V(A,R) ≈ t(R))
- **Περισσότερα reads** από writes (read-heavy workload)

❌ **ΜΗΝ δημιουργήσεις αν:**

- Το πεδίο σπάνια χρησιμοποιείται
- Η επιλεκτικότητα είναι **χαμηλή** (π.χ. gender: Male/Female)
- **Πολλά inserts/updates** (write-heavy workload)

### 5.2 Πίνακας Απόφασης

| Workload | Clustered | Secondary | Συμβουλή |
|----------|-----------|-----------|----------|
| Reads >> Writes | ✓ | ✓✓ | Φτιάξε πολλά secondary |
| Writes >> Reads | ✓ | ✗ | Minimal indexes |
| Point queries | ✓ | ✓ | Indexes on filter columns |
| Range queries | ✓✓ | ✗ | Clustered only |
| Μικρή επιλεκτικότητα | ✗ | ✗ | Table scan καλύτερο |

### 5.3 Covered Index (Bonus)

**Ορισμός:** Index που περιέχει **όλες** τις στήλες του query.

**Παράδειγμα:**

```sql
CREATE INDEX idx_name_dept ON Students(name, department);

SELECT name, department FROM Students WHERE name = 'Alice';
-- Το query μπορεί να απαντηθεί ΜΟΝΟ από το index!
-- Δεν χρειάζεται να πάει στα δεδομένα → πολύ γρήγορο!
```

---

## 6. Πρακτικά Παραδείγματα

### Παράδειγμα 1: Επιλογή Index για Query Workload

**Workload:**

```sql
-- Q1: 80% των queries
SELECT * FROM Students WHERE id = ?;

-- Q2: 15% των queries
SELECT * FROM Students WHERE department = ?;

-- Q3: 5% των queries
SELECT * FROM Students WHERE gpa > 3.5;
```

**Στρατηγική:**

- **Clustered index:** στο `id` (primary key, Q1)
- **Secondary index:** στο `department` (Q2 αρκετά συχνό, καλή επιλεκτικότητα)
- **Όχι index:** στο `gpa` (σπάνιο Q3, range query → table scan OK)

### Παράδειγμα 2: Cost Analysis

**Δεδομένα:**

- p(Students) = 500
- t(Students) = 50,000
- V(department) = 5

**Query:**

```sql
SELECT * FROM Students WHERE department = 'CS';
```

**Option A: Full Table Scan**

```
Cost = p(Students) = 500 I/Os
```

**Option B: Non-clustered Index**

```
Matching records ≈ t(Students) / V(department) = 50,000 / 5 = 10,000
Cost = d(I) + 10,000 ≈ 3 + 10,000 = 10,003 I/Os ❌
```

**Option C: Clustered Index**

```
Cost = d(I) + p(Students) / V(department) = 3 + 500/5 = 3 + 100 = 103 I/Os ✓
```

**Συμπέρασμα:** Clustered index κερδίζει!

---

## 7. Συχνές Παγίδες

❌ **ΛΑΘΟΣ:** "Περισσότερα indexes = πάντα καλύτερο"
✅ **ΣΩΣΤΟ:** Indexes επιβαρύνουν τα writes. Βρες το balance.

❌ **ΛΑΘΟΣ:** "Δευτερεύον index πάντα βοηθάει"
✅ **ΣΩΣΤΟ:** Για χαμηλή επιλεκτικότητα, table scan είναι ταχύτερο.

❌ **ΛΑΘΟΣ:** "Μπορώ να έχω πολλά clustered indexes"
✅ **ΣΩΣΤΟ:** ΜΟΝΟ ΕΝΑ clustered ανά πίνακα (φυσική διάταξη).

---

## 8. Σύνοψη Τύπων

### Κόστος Search με Index

**Clustered (equality):**

```
d(I) + ⌈p(R) / V(A,R)⌉
```

**Non-clustered (equality):**

```
d(I) + t(R) / V(A,R)  [χειρότερη περίπτωση]
```

### Κόστος Insert με k Secondary Indexes

```
Cost_insert = Cost_base + k × d(I_avg)
```

---

## 📖 Βιβλιογραφία

- Ramakrishnan & Gehrke: Chapter 8
- Ιωαννίδης: Διαφάνειες ΥΣΒΔ 2024

---

🎯 **Next Steps:**

1. Κατανόησε τη διαφορά clustered vs non-clustered
2. Εξάσκησε cost calculations
3. Πότε να χρησιμοποιήσεις full scan vs index
4. Προχώρα στο Module 05 (Query Processing)
