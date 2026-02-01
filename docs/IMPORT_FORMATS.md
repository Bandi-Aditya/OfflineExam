# Data Import Formats

## 1. Student Registration (Excel/CSV)
**Supported Formats:** .xlsx, .xls, .csv

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| StudentID | Yes | Unique ID for the student | STU101 |
| Name | Yes | Full Name | John Doe |
| Email | Yes | Email Address (Must be unique) | john@example.com |
| Password | No | Default: 'student123' | securePass1! |
| Mobile | No | Mobile Number | 1234567890 |

**Example Row:**
`STU101, John Doe, john@example.com, password123, 9876543210`

---

## 2. Question Bank (Excel/CSV)
**Supported Formats:** .xlsx, .xls, .csv

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| Topic | No | Subject/Category (Default: General) | Java |
| Difficulty | No | easy, medium, hard (Default: medium) | hard |
| QuestionText| Yes | The actual question | What is JVM? |
| Type | No | mcq, subjective (Default: mcq) | mcq |
| OptionA | Yes (MCQ)| First Option | Java Virtual Machine |
| OptionB | Yes (MCQ)| Second Option | Java Variable Machine |
| OptionC | Yes (MCQ)| Third Option | Just Very Mad |
| OptionD | Yes (MCQ)| Fourth Option | None |
| CorrectAnswer| Yes | For MCQ: A, B, C, D (or exact text)<br>For Subjective: The answer key | A |
| Marks | No | Marks for the question (Default: 1) | 5 |

**Example Row (MCQ):**
`Java, medium, What is JVM?, mcq, Java Virtual Machine, Wrong Option, Wrong, Wrong, A, 5`

**Example Row (Subjective):**
`History, easy, Who discovered America?, subjective, , , , , Columbus, 2`
