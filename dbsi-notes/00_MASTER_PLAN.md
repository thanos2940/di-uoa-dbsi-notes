# Πλάνο Μελέτης ΥΣΒΔ (3 Ημερών)

Αυτό το μεθοδικό πλάνο σπάει την ύλη σε διακριτά modules, εστιάζοντας στα θέματα με τη μεγαλύτερη βαρύτητα για το διαγώνισμα.

## Σύνοψη Modules

| Αρχείο | Θέμα | Προτεραιότητα | Εκτ. Χρόνος | Προαπαιτούμενα |
|--------|------|---------------|-------------|----------------|
| `01_physical_org.md` | Φυσική Οργάνωση & ISAM | ΧΑΜΗΛΗ | 1.0h | - |
| `02_b_plus_trees.md` | B+ Δέντρα (ΚΡΙΣΙΜΟ) | **ΥΨΗΛΗ** | 3.0h | 01 |
| `03_hashing.md` | Κατακερματισμός (Extensible) | **ΥΨΗΛΗ** | 2.0h | 01 |
| `04_secondary_indices.md` | Δευτερεύοντα Ευρετήρια | ΧΑΜΗΛΗ | 0.5h | 01, 02 |
| `05_query_basics.md` | Σχεσιακή Άλγεβρα & Scan | ΧΑΜΗΛΗ | 1.0h | - |
| `06_joins.md` | Αλγόριθμοι Ζεύξης | **ΜΕΣΑΙΑ** | 2.0h | 05 |
| `07_optimization.md` | Βελτιστοποίηση Ερωτημάτων | ΜΕΣΑΙΑ | 1.5h | 05, 06 |
| `08_concurrency_basics.md` | ACID & Χρονοπρογράμματα | ΧΑΜΗΛΗ | 1.0h | - |
| `09_serializability_2pl.md` | Σειριοποιησιμότητα & 2PL | **ΜΕΣΑΙΑ** | 2.0h | 08 |
| `10_timestamps_tips.md` | Timestamps & Exam Tips | ΜΕΣΑΙΑ | 1.0h | 09 |

---

## Αναλυτικό Πρόγραμμα 3 Ημερών

### Ημέρα 1: Δομές Δεδομένων & Ευρετήρια (Focus: High Impact)

*Στόχος: Να εξασφαλιστεί το 40-50% του βαθμού από B+ Trees και Hashing.*

1. **Morning (10:00 - 13:00):** `02_b_plus_trees.md`
   - Κατανόηση δομής κόμβων.
   - **Άσκηση:** Εισαγωγές/Διαγραφές με split/merge (ζωγράφισε δέντρα!).
   - *SOS:* Προσοχή στις ιδιαιτερότητες του καθηγητή για τη χωρητικότητα.

2. **Mid-Day (14:00 - 15:00):** `01_physical_org.md`
   - Γρήγορο πέρασμα δίσκων/buffers.
   - Κατανόηση ISAM (ως πρόγονος των B+ Trees).

3. **Evening (17:00 - 19:00):** `03_hashing.md`
   - **Focus:** Επεκτατός Κατακερματισμός.
   - **Άσκηση:** Directory doubling και split κάδων.

### Ημέρα 2: Επεξεργασία Ερωτημάτων (Focus: Algorithms & Cost)

*Στόχος: Κατανόηση κόστους I/O και αλγορίθμων ζεύξης.*

1. **Morning (10:00 - 11:30):** `05_query_basics.md` & `04_secondary_indices.md`
   - Βασικοί τελεστές και χρήση ευρετηρίων.

2. **Mid-Day (12:30 - 14:30):** `06_joins.md`
   - Nested Loop (Simple vs Block).
   - Sort-Merge Join & Hash Join.
   - **Άσκηση:** Υπολογισμός κόστους I/O με συγκεκριμένο buffer M.

3. **Evening (17:00 - 18:30):** `07_optimization.md`
   - Pipeline vs Materialization.
   - Βελτιστοποίηση βάσει κόστους (Dynamic Programming basics).

### Ημέρα 3: Concurrency Control & Final Review

*Στόχος: Θεωρητική κατανόηση ACID και επίλυση Σωστό/Λάθος.*

1. **Morning (10:00 - 13:00):** `08_concurrency_basics.md` & `09_serializability_2pl.md`
   - Σειριοποιησιμότητα (Conflict).
   - Γράφοι προτεραιότητας & 2PL.
   - **Άσκηση:** Έλεγχος αν ένα history είναι serializable.

2. **Mid-Day (15:00 - 16:00):** `10_timestamps_tips.md`
   - Timestamps (Thomas Write Rule).
   - "Σωστό/Λάθος" cheat sheet.

3. **Evening (18:00+):** Επανάληψη SOS
   - Λύσε ξανά 1 άσκηση B+ Tree.
   - Λύσε ξανά 1 άσκηση Extensible Hashing.
   - Λύσε ξανά 1 άσκηση Cost Joins.
