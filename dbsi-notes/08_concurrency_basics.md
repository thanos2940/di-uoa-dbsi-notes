# Module 08: Έλεγχος Συνδρομικότητας - Βασικά 🔐

**Προτεραιότητα:** 🟢 ΧΑΜΗΛΗ (Θεωρητική Βάση) | **Εκτ. Χρόνος:** 1.0h

---

## 📚 Εισαγωγή: Γιατί Χρειαζόμαστε Δοσοληψίες

**Σενάριο:**
Ταυτόχρονες κρατήσεις για **1 τελευταία** θέση σε πτήση:

```
T1: Read(seats) = 1
T2:                   Read(seats) = 1
T1: Write(seats = 0) ✓
T2:                   Write(seats = 0) ✓
T1: Confirm
T2:                   Confirm

Αποτέλεσμα: 2 επιβάτες επιβεβαίωσαν για 1 θέση!
```

**Πρόβλημα:** Χωρίς συντονισμό → **ασυνέπεια**!

---

## 1. Δοσοληψίες (Transactions)

### 1.1 Ορισμός

**Δοσοληψία (Transaction):** Μια **λογική μονάδα** εργασίας που αποτελείται από ακολουθία λειτουργιών.

**Δομή:**

```
BEGIN TRANSACTION
    operations (read, write, ...)
COMMIT / ABORT
```

**Παράδειγμα:**

```sql
BEGIN TRANSACTION;
    UPDATE Accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE Accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### 1.2 Λειτουργίες

**Βασικές:**

- **Read(X):** Διάβασμα αντικειμένου X από τη βάση
- **Write(X):** Εγγραφή αντικειμένου X στη βάση

**Καταληκτικές:**

- **Commit:** Επικύρωση (οι αλλαγές γίνονται μόνιμες)
- **Abort:** Ακύρωση (rollback, επιστροφή στην αρχική κατάσταση)

---

## 2. ACID Ιδιότητες

### 2.1 Atomicity (Ατομικότητα)

**Όλη η δοσοληψία ή τίποτα.**

```
T: Read(A) Write(A) Read(B) Write(B) Commit

Αν κάτι πάει στραβά στο Write(B) → Όλα ακυρώνονται!
```

**Υλοποίηση:** Logging (Write-Ahead Log - WAL)

### 2.2 Consistency (Συνέπεια)

**Η βάση περνάει από μια έγκυρη κατάσταση σε άλλη έγκυρη.**

**Παράδειγμα:**

```
Constraint: balance₁ + balance₂ = 1000

Πριν: A=600, B=400 ✓
Μεταφορά 100€ από A → B
Μετά: A=500, B=500 ✓

(Το constraint παραμένει ικανοποιημένο)
```

**Ευθύνη:** Του προγραμματιστή (να γράφει σωστές δοσοληψίες)

### 2.3 Isolation (Απομόνωση)

**Κάθε δοσοληψία εκτελείται σαν να ήταν μόνη της.**

**Ιδανικά:**

```
Ταυτόχρονη εκτέλεση = Σειριακή εκτέλεση (serializability)
```

**Υλοποίηση:** Locks, Timestamps, MVCC

### 2.4 Durability (Μονιμότητα)

**Μετά το COMMIT, οι αλλαγές δεν χάνονται ποτέ.**

**Ακόμα και αν:**

- Κρασάρει το σύστημα
- Χαθεί το ρεύμα
- Χαλάσει ο δίσκος (με backups/replication)

**Υλοποίηση:** Write-Ahead Log + Force-Write at Commit

---

## 3. Χρονοπρογράμματα (Schedules)

### 3.1 Ορισμός

**Schedule:** Η **χρονική σειρά** εκτέλεσης λειτουργιών από **πολλές** δοσοληψίες.

**Συμβολισμός:**

- $R_i[X]$: Δοσοληψία $T_i$ διαβάζει το X
- $W_i[X]$: Δοσοληψία $T_i$ γράφει το X
- $C_i$: Commit της $T_i$
- $A_i$: Abort της $T_i$

### 3.2 Σειριακά Schedules (Serial)

**Ορισμός:** Κάθε δοσοληψία **ολοκληρώνεται πλήρως** πριν αρχίσει η επόμενη.

**Παράδειγμα:**

```
S₁: R₁[X] W₁[X] R₁[Y] W₁[Y] C₁  R₂[X] W₂[X] C₂
```

**Ιδιότητα:** Τα σειριακά schedules είναι **πάντα σωστά** (consistent).

**Πρόβλημα:** **Μηδενική παραλληλία** → πολύ αργά!

### 3.3 Σύγχρονα Schedules (Concurrent)

**Ορισμός:** Οι λειτουργίες των δοσοληψιών **πλέκονται** (interleave).

**Παράδειγμα:**

```
S₂: R₁[X] R₂[X] W₁[X] W₂[X] C₁ C₂
```

**Στόχος:** Να βρούμε ποια concurrent schedules είναι **ισοδύναμα** με σειριακά → **Σειριοποιήσιμα (Serializable)**

---

## 4. Προβλήματα Σύγχρονης Εκτέλεσης

### 4.1 Dirty Read (Βρώμικη Ανάγνωση - WR)

**Πρόβλημα:** Διάβασμα **μη επικυρωμένης** τιμής.

```
T₁: W[X=100]
T₂:           R[X]  ← Διαβάζει 100
T₁:           Abort ← X επιστρέφει στην παλιά τιμή!
T₂:                 C ← Commit με **λάθος** δεδομένα
```

**Επίδραση:** Η T₂ έκανε commit δεδομένα που "δεν έπρεπε να υπάρχουν".

### 4.2 Unrepeatable Read (Μη Επαναλήψιμη Ανάγνωση - RW)

**Πρόβλημα:** Η τιμή **αλλάζει** μεταξύ δύο reads.

```
T₁: R[X=50]
T₂:         W[X=100] C
T₁:         R[X=100]  ← Διαφορετική τιμή!
```

**Επίδραση:** Η T₁ βλέπει **ασυνεπή snapshot** των δεδομένων.

### 4.3 Lost Update (Χαμένη Ενημέρωση - WW)

**Πρόβλημα:** Η εγγραφή μιας δοσοληψίας **επικαλύπτει** άλλη.

```
T₁: R[X=50]
T₂:         R[X=50]
T₁: W[X=40]  ← X = 50 - 10
T₂:         W[X=45]  ← X = 50 - 5
T₁: C
T₂:         C

Αποτέλεσμα: X=45 (η αλλαγή του T₁ χάθηκε!)
```

### 4.4 Phantom Read (Φάντασμα)

**Πρόβλημα:** Νέες εγγραφές εμφανίζονται μεταξύ δύο reads.

```
T₁: SELECT COUNT(*) FROM Students WHERE gpa > 3.5  → 10
T₂:         INSERT INTO Students (gpa=3.8, ...)
T₂:         C
T₁: SELECT COUNT(*) FROM Students WHERE gpa > 3.5  → 11
```

**Επίδραση:** Η T₁ βλέπει "φαντάσματα" (νέες εγγραφές που δεν υπήρχαν).

---

## 5. Levels of Isolation (Επίπεδα Απομόνωσης)

| Level | Dirty Read | Unrepeatable Read | Phantom | Locks |
|-------|------------|-------------------|---------|-------|
| **Read Uncommitted** | ✓ Μπορεί | ✓ Μπορεί | ✓ Μπορεί | Minimal |
| **Read Committed** | ✗ Όχι | ✓ Μπορεί | ✓ Μπορεί | Short S-locks |
| **Repeatable Read** | ✗ Όχι | ✗ Όχι | ✓ Μπορεί | Long S-locks |
| **Serializable** | ✗ Όχι | ✗ Όχι | ✗ Όχι | Strict 2PL |

**SQL:**

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## 6. Παραδείγματα Schedules

### Παράδειγμα 1: Lost Update

```
T₁: R[A=100]
T₂:          R[A=100]
T₁: A = A - 50
T₁: W[A=50]
T₁: C
T₂:          A = A - 30
T₂:          W[A=70]  ← Βασίστηκε στο A=100, όχι 50!
T₂:          C

Αποτέλεσμα: A=70 (αντί για 20)
```

### Παράδειγμα 2: Σωστό Schedule

```
T₁: R[A=100]
T₁: W[A=50]
T₁: C
T₂:          R[A=50]  ← Βλέπει το committed value
T₂:          W[A=20]
T₂:          C

Αποτέλεσμα: A=20 ✓
```

---

## 7. Απλές Έννοιες Locks (Προπαρασκευή για Module 09)

### S-lock (Shared)

- Για **read**
- Πολλές δοσοληψίες μπορούν να έχουν ταυτόχρονα

### X-lock (Exclusive)

- Για **write**
- Μόνο ΜΙΑ δοσοληψία

**Βασική ιδέα:**

```
Πριν Read(X)  → Get S-lock(X)
Πριν Write(X) → Get X-lock(X)
Μετά Commit   → Release όλα
```

---

## 8. Σύνοψη

### ACID

```
Atomicity:    All or nothing
Consistency:  Valid state → Valid state
Isolation:    As if alone
Durability:   Commit = permanent
```

### Schedules

```
Serial:       T₁ πλήρως, μετά T₂ → Πάντα σωστά
Concurrent:   Interleaved → Πρέπει έλεγχο!
```

### Προβλήματα

```
WR: Dirty Read
RW: Unrepeatable Read
WW: Lost Update
```

### Στόχος

```
Να βρούμε schedules που είναι "ασφαλή" (serializable)
→ Module 09: Serializability & 2PL
```

---

## 📖 Βιβλιογραφία

- Ramakrishnan & Gehrke: Chapter 16
- Ιωαννίδης: Διαφάνειες ΥΣΒΔ 2024
- Bernstein et al.: "Concurrency Control and Recovery in Database Systems"

---

🎯 **Next Steps:**

1. Κατανόησε τη διαφορά ACID properties
2. Εξάσκησε αναγνώριση προβλημάτων (Dirty, Lost, ...)
3. Μάθε τα επίπεδα isolation
4. Προχώρα στο Module 09 (Serializability)
