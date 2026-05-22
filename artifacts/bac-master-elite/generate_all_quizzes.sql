-- Nettoyer les anciens quiz
DELETE FROM quiz_questions;

-- Générer 3 questions par leçon
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation)
SELECT 
  l.id,
  'Que signifie le titre "' || l.title || '" ?',
  ARRAY[
    COALESCE(l.title, 'Le sujet principal'),
    'Une information secondaire',
    'Un exemple illustratif',
    'Une introduction'
  ],
  0,
  'Le titre résume le thème central de la leçon.'
FROM lessons l
WHERE l.id NOT IN (SELECT DISTINCT lesson_id FROM quiz_questions);

INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation)
SELECT 
  l.id,
  'Pour maîtriser cette leçon, il faut surtout :',
  ARRAY[
    'Comprendre les concepts clés',
    'Mémoriser par cœur',
    'Lire rapidement',
    'Passer à autre chose'
  ],
  0,
  'La compréhension des concepts est essentielle.'
FROM lessons l
WHERE l.id NOT IN (SELECT DISTINCT lesson_id FROM quiz_questions WHERE question LIKE '%Pour maîtriser%');

INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation)
SELECT 
  l.id,
  'Après cette leçon, vous êtes capable de :',
  ARRAY[
    'Expliquer le sujet à quelqu\'un',
    'Répondre à des questions basiques',
    'Reconnaître le sujet',
    'Rien de plus'
  ],
  0,
  'L''objectif est de pouvoir expliquer le sujet.'
FROM lessons l
WHERE l.id NOT IN (SELECT DISTINCT lesson_id FROM quiz_questions WHERE question LIKE '%Après cette leçon%');
