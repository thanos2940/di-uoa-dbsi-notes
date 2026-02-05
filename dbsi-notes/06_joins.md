# Module 06: Αλγόριθμοι Ζεύξης (Join Algorithms) 🔗

**Προτεραιότητα:** 🔴 ΥΨΗΛΗ (12 Μονάδες) | **Εκτ. Χρόνος:** 2.0h

---

## 📚 Εισαγωγή: Γιατί οι Ζεύξεις είναι Κρίσιμες

Η **ζεύξη (join)** είναι η **πιο ακριβή** λειτουργία στη βάση δεδομένων. Ένα τυπικό ερώτημα μπορεί να κάνει:

- 50 I/Os → με κακό αλγόριθμο γίνονται 50,000!
- 2 λεπτά → με κακό αλγόριθμο 2 ώρες!

Το **60-70% του χρόνου εκτέλεσης** πολύπλοκων queries πάει σε joins. Γι' αυτό ο optimizer επιλέγει προσεκτικά τον αλγόριθμο.

### Τύποι Ζεύξεων

```sql
-- Equi-Join (Ισότητα)
SELECT * FROM R, S WHERE R.A = S.B

-- Natural Join
SELECT * FROM R NATURAL JOIN S

-- Theta-Join (Γενική συνθήκη)
SELECT * FROM R, S WHERE R.A < S.B
```

> 💡 Στις ασκήσεις εστιάζουμε σε **equi-join** (ισότητα).

---

## 1. Nested Loop Join (NLJ) - Βασικός Αλγόριθμος

### 1.1 Simple Nested Loop (Tuple-based)

**Ιδέα:** "Για κάθε εγγραφή του R, σάρωσε όλο τον S"

```python
for each tuple r in R:
    for each tuple s in S:
        if r.A == s.B:
            output (r, s)
```

#### Ανάλυση Κόστους

- **Διαβάζουμε όλο τον R:** $p(R)$ I/Os
- **Για κάθε εγγραφή του R, διαβάζουμε όλο τον S:** $t(R) \times p(S)$ I/Os
- **Συνολικό κόστος:**

```
Cost = p(R) + t(R) × p(S)
```

**Παράδειγμα:**

```
R: 100 σελίδες, 1000 εγγραφές
S: 50 σελίδες

Cost = 100 + 1000 × 50 = 100 + 50,000 = 50,100 I/Os
```

> ❌ **Απαράδεκτα αργό!** Γι' αυτό δεν χρησιμοποιείται ποτέ στην πράξη.

---

### 1.2 Block Nested Loop (Page-oriented) - **ΣΗΜΑΝΤΙΚΟ**

**Ιδέα:** "Για κάθε **μπλοκ** του R, σάρωσε όλο τον S"

```python
for each block B_R in R:
    for each block B_S in S:
        for each tuple r in B_R:
            for each tuple s in B_S:
                if r.A == s.B:
                    output (r, s)
```

#### Κόστος με Buffer = 3 σελίδες

```
1 σελίδα για R
1 σελίδα για S
1 σελίδα για output

Cost = p(R) + p(R) × p(S)
```

**Το ίδιο παράδειγμα:**

```
Cost = 100 + 100 × 50 = 100 + 5,000 = 5,100 I/Os
```

> Βελτίωση **10x** με απλή αλλαγή!

#### Κόστος με Buffer = M σελίδες

**Βέλτιστη χρήση μνήμης:**

- **M-2 σελίδες** για τον **Outer** πίνακα (R)
- **1 σελίδα** για τον **Inner** πίνακα (S)
- **1 σελίδα** για output

**Λογική:**

- Διαβάζουμε τον R σε "τσαμπιά" (chunks) των M-2 σελίδων
- Για κάθε chunk, σαρώνουμε όλο τον S μία φορά

**Πλήθος chunks:**

```
Chunks = ⌈p(R) / (M-2)⌉
```

**Συνολικό κόστος:**

```
Cost = p(R) + ⌈p(R)/(M-2)⌉ × p(S)
```

#### ✏️ Solved Example: Block NL με M=12

**Δεδομένα:**

- R: 100 σελίδες
- S: 50 σελίδες
- M = 12 σελίδες μνήμης

**Υπολογισμός:**

```
Chunks του R = ⌈100 / (12-2)⌉ = ⌈100/10⌉ = 10

Cost = 100 + 10 × 50
     = 100 + 500
     = 600 I/Os
```

**Σύγκριση:**

- Simple NL: 50,100
- Block NL (M=3): 5,100
- Block NL (M=12): **600** ✓

> 💡 **Με 12 σελίδες buffer, βελτίωση 83x!**

### 1.3 Ποιον Πίνακα Βάζουμε Outer

**Κανόνας:**
> Βάλε **OUTER** τον πίνακα με το **μικρότερο** $p(R)$ (αριθμό σελίδων).

**Γιατί;**

```
Αν R outer: Cost = p(R) + ⌈p(R)/(M-2)⌉ × p(S)
Αν S outer: Cost = p(S) + ⌈p(S)/(M-2)⌉ × p(R)
```

Θέλουμε να ελαχιστοποιήσουμε τον όρο $\lceil \text{outer}/(M-2) \rceil \times \text{inner}$.

**Παράδειγμα:**

```
p(R) = 20, p(S) = 100, M = 12

Option 1 (R outer): 20 + ⌈20/10⌉ × 100 = 20 + 2×100 = 220 ✓
Option 2 (S outer): 100 + ⌈100/10⌉ × 20 = 100 + 10×20 = 300 ✗
```

### 1.4 Πολιτική Αντικατάστασης Buffer

**LRU (Least Recently Used):**

- Εκδιώκει το λιγότερο πρόσφατα χρησιμοποιημένο
- **Καλό για τον outer** (σαρώνουμε σειριακά)
- **ΚΑΚΟ για τον inner** (επαναλαμβάνουμε συνέχεια)

**MRU (Most Recently Used):**

- Εκδιώκει το πιο πρόσφατα χρησιμοποιημένο
- **Καλό για τον inner** (cyclical access pattern)

> 💡 **Tip του καθηγητή:** Αν ο inner χωράει στη μνήμη, το MRU είναι ιδανικό.

---

## 2. Sort-Merge Join - **ΣΗΜΑΝΤΙΚΟ**

### 2.1 Βασική Ιδέα

**Προϋπόθεση:** Και οι δύο πίνακες **ταξινομημένοι** στο join attribute.

**Αλγόριθμος:**

```python
# Merge phase
i = 0  # pointer στον R
j = 0  # pointer στον S

while i < len(R) and j < len(S):
    if R[i].A < S[j].B:
        i += 1
    elif R[i].A > S[j].B:
        j += 1
    else:  # R[i].A == S[j].B
        # Output όλα τα ταιριάσματα
        output matches
        i += 1
```

**Κόστος Merge Phase:**

```
Cost_merge = p(R) + p(S)
```

Κάθε σελίδα διαβάζεται **μία φορά** (single pass).

### 2.2 External Merge Sort

Αν οι πίνακες **ΔΕΝ** είναι ταξινομημένοι, πρέπει να τους ταξινομήσουμε πρώτα.

#### Αλγόριθμος 2-Way External Sort

1. **Pass 0 (Create Runs):**
   - Διάβασε M σελίδες
   - Ταξινόμησε στη μνήμη
   - Γράψε πίσω (sorted run)
   - Αριθμός runs = $\lceil p(R)/M \rceil$

2. **Pass 1, 2, ... (Merge Passes):**
   - Merge κάθε ζευγάρι runs
   - Συνέχισε μέχρι να μείνει 1 run

**Πλήθος passes:**

```
Passes = 1 + ⌈log₂(⌈p(R)/M⌉)⌉
```

**Κόστος ταξινόμησης:**

```
Cost_sort = 2 × p(R) × Passes
```

(Το "2×" γιατί κάθε pass κάνει read ΚΑΙ write)

#### Multi-Way Merge Sort (Με M σελίδες buffer)

**Βελτιστοποίηση:** Merge **M-1** runs ταυτόχρονα.

```
M-1 input buffers (ένα για κάθε run)
1 output buffer
```

**Αριθμός passes:**

```
Passes = 1 + ⌈log_{M-1}(⌈p(R)/M⌉)⌉
```

**Κόστος:**

```
Cost_sort(R) = 2 × p(R) × (1 + ⌈log_{M-1}(⌈p(R)/M⌉)⌉)
```

### 2.3 Συνολικό Κόστος Sort-Merge Join

```
Cost_total = Cost_sort(R) + Cost_sort(S) + p(R) + p(S)
```

#### ✏️ Solved Example: Sort-Merge με M=10

**Δεδομένα:**

- R: 100 σελίδες
- S: 50 σελίδες
- M = 10 σελίδες

**Βήμα 1: Ταξινόμηση R**

```
Initial runs = ⌈100/10⌉ = 10
Passes = 1 + ⌈log₉(10)⌉ = 1 + ⌈1.048⌉ = 1 + 2 = 3
         (M-1 = 9, log₉(10) ≈ 1.048)
         
Wait, let me recalculate:
log₉(10) = log(10)/log(9) ≈ 1.048
⌈1.048⌉ = 2

Passes = 1 + 2 = 3 ✗  

Actually: 1 (initial) + ceil(log_9(10)) = 1 + 2 = 3? 
No, wait. The formula is:
Passes = 1 + ⌈log_{M-1}(initial_runs)⌉

Initial runs = ⌈100/10⌉ = 10
log₉(10) ≈ 1.048 → ⌈1.048⌉ = 2

Total passes = 1 (create runs) + 2 (merge passes) = 3

Cost_sort(R) = 2 × 100 × 3 = 600
```

**Βήμα 2: Ταξινόμηση S**

```
Initial runs = ⌈50/10⌉ = 5
log₉(5) ≈ 0.732 → ⌈0.732⌉ = 1
Passes = 1 + 1 = 2

Cost_sort(S) = 2 × 50 × 2 = 200
```

**Βήμα 3: Merge**

```
Cost_merge = 100 + 50 = 150
```

**Συνολικό:**

```
Cost_total = 600 + 200 + 150 = 950 I/Os
```

### 2.4 Πότε είναι Καλό το Sort-Merge

✅ **Καλό όταν:**

- Οι πίνακες ήδη ταξινομημένοι (ή υπάρχει clustered index)
- Θέλουμε το αποτέλεσμα ταξινομημένο (για ORDER BY)
- Μεγάλοι πίνακες με αρκετή μνήμη

❌ **Κακό όταν:**

- Μικροί πίνακες (το overhead της ταξινόμησης δεν αξίζει)
- Λίγη μνήμη (πολλά merge passes)

---

## 3. Hash Join - **ΣΗΜΑΝΤΙΚΟ**

### 3.1 Βασική Ιδέα

**Προϋπόθεση:** Equality join (R.A = S.B)

**Στρατηγική:**

1. **Partition:** Σπάσε τους R και S σε buckets με την ίδια hash function
2. **Build & Probe:** Για κάθε bucket, κάνε in-memory hash join

**Γιατί δουλεύει;**

- Αν R[i].A = S[j].B → τότε H(R[i].A) = H(S[j].B)
- Άρα θα πέσουν στο **ίδιο bucket**!
- Bucket-by-bucket join → μικρά subproblems

### 3.2 Αλγόριθμος (2 Φάσεις)

#### Phase 1: Partitioning

```python
h1 = hash function  # π.χ. h(x) = x mod k

# Partition R
for each page in R:
    for each tuple r:
        bucket = h1(r.A)
        write r to R_bucket

# Partition S (με την ΙΔΙΑ hash!)
for each page in S:
    for each tuple s:
        bucket = h1(s.B)
        write s to S_bucket
```

**Κόστος Phase 1:**

```
Read: p(R) + p(S)
Write: p(R) + p(S)
Total: 2 × (p(R) + p(S))
```

#### Phase 2: Build & Probe

```python
for each bucket i:
    # Build: Φόρτωσε R_i στη μνήμη
    hash_table = {}
    h2 = different hash function
    for each r in R_i:
        hash_table[h2(r.A)].append(r)
    
    # Probe: Σάρωσε S_i
    for each s in S_i:
        if h2(s.B) in hash_table:
            for r in hash_table[h2(s.B)]:
                if r.A == s.B:  # check για safety
                    output (r, s)
```

**Κόστος Phase 2:**

```
Read: p(R) + p(S)
(Κάθε partition διαβάζεται μία φορά)
```

### 3.3 Συνολικό Κόστος

```
Cost = 2(p(R) + p(S))  [Partitioning]
     + (p(R) + p(S))   [Probing]
     = 3 × (p(R) + p(S))
```

> 💡 Πολύ απλός τύπος: **3× το μέγεθος των πινάκων!**

### 3.4 Προϋποθέσεις

**Κρίσιμη προϋπόθεση:** Το **μικρότερο partition** πρέπει να χωράει στη μνήμη.

**Έστω:**

- Κάνουμε partition σε $k$ buckets
- Μικρότερος πίνακας: R με $p(R)$ σελίδες
- Κάθε partition: περίπου $p(R)/k$ σελίδες

**Θέλουμε:**

```
p(R)/k < M - 2
(M-2 για hash table, 1 για input, 1 για output)

Άρα: k > p(R)/(M-2)
```

**Ελάχιστος αριθμός buckets:**

```
k_min ≈ p(R)/(M-2)
```

#### ✏️ Solved Example: Hash Join με M=10

**Δεδομένα:**

- R: 80 σελίδες (μικρότερος)
- S: 200 σελίδες
- M = 10

**Έλεγχος feasibility:**

```
k > 80/(10-2) = 80/8 = 10
Επιλέγουμε k = 16 buckets (power of 2)

Μέγιστο partition του R: 80/16 = 5 σελίδες ✓
Χωράει στις M-2 = 8 σελίδες ✓
```

**Κόστος:**

```
Cost = 3 × (80 + 200) = 3 × 280 = 840 I/Os
```

### 3.5 Πότε είναι Καλό το Hash Join

✅ **Καλό όταν:**

- **Equality joins** (R.A = S.B)
- Ένας πίνακας χωράει στη μνήμη (ή κοντά)
- Δεν χρειαζόμαστε ταξινομημένο αποτέλεσμα

❌ **Κακό όταν:**

- Theta joins (≠, <, >)
- Πολύ λίγη μνήμη (δεν χωράει partition)
- Skewed data (έναpartition γίνεται τεράστιο)

---

## 4. Σύγκριση Αλγορίθμων

### 4.1 Πίνακας Πολυπλοκοτήτων

| Αλγόριθμος | Κόστος (I/Os) | Προϋποθέσεις | Best Use |
|------------|---------------|--------------|----------|
| **Simple NL** | $p(R) + t(R) \times p(S)$ | Καμία | Ποτέ! |
| **Block NL** | $p(R) + \lceil p(R)/(M-2) \rceil \times p(S)$ | Καμία | Μικροί πίνακες ή index |
| **Sort-Merge** | $Sort(R) + Sort(S) + p(R) + p(S)$ | Φτηνό sort | Μεγάλοι, χρειάζεται ταξινόμηση |
| **Hash Join** | $3(p(R) + p(S))$ | $p(R) < M(M-2)$ | Equality, ένας χωράει |

### 4.2 Παράδειγμα Σύγκρισης

**Σενάριο:**

- R: 100 σελίδες, 10,000 εγγραφές
- S: 50 σελίδες, 5,000 εγγραφές
- M = 12 σελίδες

| Αλγόριθμος | Υπολογισμός | Κόστος |
|------------|-------------|--------|
| Simple NL | $100 + 10000 \times 50$ | 500,100 |
| Block NL | $100 + \lceil 100/10 \rceil \times 50$ | 100 + 500 = **600** |
| Sort-Merge | Περίπλοκο (βλ. παραπάνω) | ~900 |
| Hash | $3 \times (100 + 50)$ | **450** ✓ |

> 💡 **Hash Join κερδίζει** σε αυτό το σενάριο!

---

## 5. Index Nested Loop Join (Bonus)

Αν υπάρχει **ευρετήριο** στο join attribute του inner πίνακα:

```
for each tuple r in R:
    use index to find matching tuples in S
    output matches
```

**Κόστος:**

```
Cost = p(R) + t(R) × (d(I) + matching_pages)

Όπου:
- d(I) = βάθος ευρετηρίου
- matching_pages = σελίδες με matches
```

**Παράδειγμα:**

```
R: 100 σελίδες, 1000 εγγραφές
Index στο S: βάθος 3
Κάθε match βρίσκει κατά μέσο όρο 2 σελίδες

Cost = 100 + 1000 × (3 + 2) = 100 + 5000 = 5,100
```

---

## 6. Στρατηγική Εξετάσεων

### 6.1 Τυπική Άσκηση

> **"Δίνονται:**
>
> - p(R) = 80, t(R) = 8,000
> - p(S) = 40, t(S) = 4,000
> - V(A,R) = 100, V(B,S) = 50
> - Buffer M = 10 σελίδες
>
> **Ζητείται:** Υπολογίστε το κόστος του R ⋈ S με:
> α) Block Nested Loop
> β) Sort-Merge Join
> γ) Hash Join"

### 6.2 Checklist Λύσης

- [ ] Προσδιόρισα ποιος είναι ο μικρότερος πίνακας (για outer);
- [ ] Χρησιμοποίησα σωστά το M στους τύπους;
- [ ] Για Sort-Merge: Υπολόγισα passes σωστά;
- [ ] Για Hash: Έλεγξα αν χωράει partition στη μνήμη;
- [ ] Έγραψα τις μονάδες (I/Os);

### 6.3 Συχνές Παγίδες

❌ **ΛΑΘΟΣ:** "Block NL cost = p(R) × p(S)"
✅ **ΣΩΣΤΟ:** $p(R) + \lceil p(R)/(M-2) \rceil \times p(S)$

❌ **ΛΑΘΟΣ:** "Hash join cost = 2(p(R) + p(S))"
✅ **ΣΩΣΤΟ:** $3(p(R) + p(S))$

❌ **ΛΑΘΟΣ:** "Πάντα ο μικρός outer στο Block NL"
✅ **ΣΩΣΤΟ:** Ναι, αλλά **σε πλήθος σελίδων p(R), όχι εγγραφών t(R)!**

---

## 7. Τυπολόγιο - Σύνοψη

### Block Nested Loop

```
Cost = p(Outer) + ⌈p(Outer)/(M-2)⌉ × p(Inner)

Βέλτιστο: Outer = min(p(R), p(S))
```

### Sort-Merge Join

```
Cost_total = Cost_sort(R) + Cost_sort(S) + p(R) + p(S)

Cost_sort(X) = 2 × p(X) × (1 + ⌈log_{M-1}(⌈p(X)/M⌉)⌉)
```

### Hash Join

```
Cost = 3 × (p(R) + p(S))

Προϋπόθεση: min(p(R), p(S)) ≤ M(M-2)
```

---

## 8. Πέρα από τα Βασικά (Advanced)

### 8.1 Hybrid Hash Join

Συνδυασμός: Κράτα το πρώτο partition στη μνήμη (δεν το γράφεις).

- Κόστος: Λίγο < 3(p(R) + p(S))

### 8.2 Grace Hash Join

Πιο resilient σε skew (ανισοκατανομή).

### 8.3 Θαμνώδη Πλάνα (Bushy Plans)

Αντί για left-deep trees: (R ⋈ S) ⋈ (T ⋈ U)

---

## 📖 Βιβλιογραφία

- Ramakrishnan & Gehrke: Chapter 14 (Evaluation of Relational Operators)
- Ιωαννίδης: Διαφάνειες ΥΣΒΔ 2024
- Graefe: "Query Evaluation Techniques" (Survey paper)

---

🎯 **Next Steps:**

1. Λύσε 3 ασκήσεις κόστους από παλιά θέματα
2. Σύγκρινε τα 3 algorithms σε διαφορετικά M
3. Χρησιμοποίησε το Cost Calculator simulator
4. Εξάσκησε τον τύπο του Sort-Merge (είναι tricky!)
