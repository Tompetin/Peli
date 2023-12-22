const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE questions (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT)');
  db.run('CREATE TABLE answers (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER, answer TEXT, FOREIGN KEY(question_id) REFERENCES questions(id))');

  // Lisätään matematiikkakysymyksiä ja vastauksia tietokantaan
  db.run('INSERT INTO questions (question) VALUES ("Montako astetta on suorakulma?")');
  db.run('INSERT INTO answers (question_id, answer) VALUES (1, "90")');

  db.run('INSERT INTO questions (question) VALUES ("Mikä on nollan käänteisluku?")');
  db.run('INSERT INTO answers (question_id, answer) VALUES (2, "Ei ole käänteislukua")');

  db.run('INSERT INTO questions (question) VALUES ("Kuinka monta sivua on kuusikulmiolla?")');
  db.run('INSERT INTO answers (question_id, answer) VALUES (3, "6")');

  db.run('INSERT INTO questions (question) VALUES ("Mikä on piin likiarvoinen desimaaliluku?")');
  db.run('INSERT INTO answers (question_id, answer) VALUES (4, "3.14159")');

  db.run('INSERT INTO questions (question) VALUES ("Mikä on 7 kertaa 8?")');
  db.run('INSERT INTO answers (question_id, answer) VALUES (5, "56")');
});

// REST-rajapinta kaikkien kysymysten hakemiseen
app.get('/questions', (req, res) => {
  db.all('SELECT * FROM questions', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// REST-rajapinta kysymyksen lisäämiseen
app.post('/questions', express.json(), (req, res) => {
  const { question } = req.body;
  if (!question) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  db.run('INSERT INTO questions (question) VALUES (?)', [question], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, question });
  });
});

// REST-rajapinta vastauksen lisäämiseen kysymykseen
app.post('/answers/:id', express.json(), (req, res) => {
  const questionId = req.params.id;
  const { answer } = req.body;
  if (!answer) {
    res.status(400).json({ error: 'Answer is required' });
    return;
  }

  db.run('INSERT INTO answers (question_id, answer) VALUES (?, ?)', [questionId, answer], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, question_id: questionId, answer });
  });
});

// REST-rajapinta vastauksen tarkistamiseen
app.post('/check-answer/:id', express.json(), (req, res) => {
    const questionId = req.params.id;
    const { userAnswer } = req.body;
  
    // Haetaan oikea vastaus tietokannasta
    db.get('SELECT answer FROM answers WHERE question_id = ?', [questionId], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
  
      if (!row) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }
  
      const correctAnswer = row.answer;
  
      // Tarkistetaan käyttäjän antama vastaus ja verrataan sitä oikeaan vastaukseen
      if (userAnswer === correctAnswer) {
        res.json({ result: 'Correct answer!' });
      } else {
        res.json({ result: 'Incorrect answer!' });
      }
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

