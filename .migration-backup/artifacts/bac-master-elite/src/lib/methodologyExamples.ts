export type MethodologyExample = {
  key: string;
  type: "Dissertation" | "Maths" | "Commentaire" | "Histoire-Géo";
  sujet: string;
  exemple: string;
};

export const methodologyExamples: Record<string, MethodologyExample> = {
  dissertation: {
    key: "dissertation",
    type: "Dissertation",
    sujet: "« La liberté est-elle l'absence de toute contrainte ? »",
    exemple: `## Introduction

Lorsqu'un adolescent réclame plus de liberté à ses parents, il entend souvent par là moins de règles. Cette intuition courante assimile la liberté à l'absence de contraintes. **Mais une telle définition résiste-t-elle à l'analyse ?**

> **Problématique :** La liberté se réduit-elle à un état d'indépendance totale, ou suppose-t-elle au contraire des règles qui la rendent possible ?

Nous montrerons d'abord que la liberté semble bien s'opposer à la contrainte (I), puis qu'une liberté sans loi se retourne contre elle-même (II), avant de penser une liberté véritable comme autonomie (III).

## I. La liberté semble être l'absence de contraintes

- **Sens commun :** être libre, c'est faire ce que l'on veut. Hobbes, dans le *Léviathan*, définit la liberté naturelle comme l'absence d'obstacles extérieurs au mouvement.
- **Exemple :** un prisonnier est privé de liberté parce qu'il ne peut se déplacer.
- **Limite :** cette définition rend toute société liberticide, ce qui est contre-intuitif.

## II. Mais une liberté sans loi se détruit elle-même

- **Argument :** sans règles, la liberté de chacun menace celle des autres. Rousseau parle de « l'état de guerre » dans le *Contrat social*.
- **Exemple :** la circulation routière. Sans code de la route, plus personne ne circule librement.
- **Conséquence :** la contrainte juridique n'est pas l'ennemie de la liberté, elle en est la condition.

## III. La liberté véritable est autonomie

- **Thèse :** Kant, dans la *Critique de la raison pratique*, définit la liberté comme obéissance à la loi qu'on s'est donnée à soi-même.
- **Exemple :** l'élève qui choisit de réviser plutôt que de céder à ses pulsions exerce une liberté supérieure à celle du procrastinateur « libre » de tout faire.
- **Distinction clé :** liberté ≠ licence.

## Conclusion

La liberté n'est donc pas l'absence de toute contrainte, mais la capacité d'agir selon des règles que l'on reconnaît comme siennes. **Loin de s'opposer à la loi, la liberté véritable la suppose.** On peut alors se demander si une société est d'autant plus libre qu'elle multiplie ces lois consenties — ou s'il existe un seuil à ne pas franchir.`,
  },
  maths: {
    key: "maths",
    type: "Maths",
    sujet: "Étudier les variations de f(x) = x³ − 3x + 2 sur ℝ.",
    exemple: `## 1. Lecture et hypothèses

- Fonction polynôme du troisième degré, définie et dérivable sur ℝ.
- On cherche le sens de variation → on calcule **f'(x)**, on étudie son signe, on dresse le tableau.

## 2. Calcul de la dérivée

\`f'(x) = 3x² − 3 = 3(x² − 1) = 3(x − 1)(x + 1)\`

## 3. Étude du signe de f'(x)

| x        | −∞ | −1 | 1  | +∞ |
|----------|----|----|----|----|
| f'(x)    | +  | 0  | 0  | +  |
|          |    | −  |    |    |

- f'(x) > 0 sur ]−∞ ; −1[ ∪ ]1 ; +∞[ → f croissante.
- f'(x) < 0 sur ]−1 ; 1[ → f décroissante.

## 4. Calcul des extrema

- **Maximum local en x = −1** : f(−1) = (−1)³ − 3(−1) + 2 = **4**
- **Minimum local en x = 1** : f(1) = 1 − 3 + 2 = **0**

## 5. Vérification (cohérence)

- Cohérent avec f(0) = 2 (entre 0 et 4 sur la phase décroissante ✓).
- Limites : f(x) → −∞ quand x → −∞, f(x) → +∞ quand x → +∞ ✓.

## 6. Conclusion

f est **strictement croissante** sur ]−∞ ; −1] et sur [1 ; +∞[, **strictement décroissante** sur [−1 ; 1], avec un maximum local de 4 en −1 et un minimum local de 0 en 1.`,
  },
  commentaire: {
    key: "commentaire",
    type: "Commentaire",
    sujet: "Commentaire d'un extrait du sonnet « Demain, dès l'aube » de Victor Hugo.",
    exemple: `> *« Demain, dès l'aube, à l'heure où blanchit la campagne,*
> *Je partirai. Vois-tu, je sais que tu m'attends. […] »*

## Introduction

Publié dans *Les Contemplations* en 1856, ce sonnet de Victor Hugo s'adresse à sa fille Léopoldine, morte noyée à 19 ans. **En quoi ce poème transforme-t-il une marche ordinaire en un pèlerinage funèbre ?** Nous étudierons d'abord la mise en scène d'un voyage solitaire (I), puis le glissement progressif vers le deuil (II).

## I. Un voyage qui semble banal

- **Repères temporels concrets** : « Demain, dès l'aube », « le soir » → le poème suit une journée entière.
- **Mouvement du marcheur** : verbes d'action au futur (« je partirai », « j'irai ») qui posent une promesse.
- **Champ lexical de la nature** : « campagne », « forêt », « montagne » → un cadre rassurant en apparence.

## II. Mais un cheminement vers la mort

- **Repli intérieur** : « les yeux fixés sur mes pensées », « sans rien voir au dehors » → le monde extérieur s'efface.
- **Champ lexical du deuil** : « triste », « seul », « inconnu », « courbé » → la marche devient procession.
- **Chute du dernier vers** : « un bouquet de houx vert et de bruyère en fleur » → ce n'est pas une visite, c'est un dépôt sur une tombe. Le lecteur comprend rétrospectivement.

## Conclusion

Hugo transfigure ainsi une simple marche en hommage funèbre, en jouant sur le décalage entre le ton apparemment paisible et la révélation finale. **Le poème devient un acte d'amour paternel adressé par-delà la mort**, ce qui en fait l'un des sommets de la poésie intime du XIXᵉ siècle.`,
  },
  histoire: {
    key: "histoire",
    type: "Histoire-Géo",
    sujet: "Étude d'un discours de Charles de Gaulle (extrait, 18 juin 1940).",
    exemple: `## 1. Présentation du document

- **Nature** : discours radiodiffusé.
- **Auteur** : Général Charles de Gaulle, secrétaire d'État à la Guerre.
- **Date** : 18 juin 1940, lendemain de la demande d'armistice par Pétain.
- **Source** : enregistrement BBC, Londres.
- **Destinataire** : les Français, militaires et civils.

## 2. Idée principale

De Gaulle refuse la défaite et appelle à la poursuite de la lutte aux côtés des Alliés. Il fonde par cet appel la Résistance extérieure (la « France Libre »).

## 3. Connaissances extérieures à mobiliser

- Contexte : *Blitzkrieg* allemand de mai-juin 1940, défaite militaire française, exode.
- Pétain demande l'armistice le 17 juin → signé le 22 juin à Rethondes.
- L'appel a peu d'auditeurs en direct mais une portée symbolique majeure.
- Naissance progressive de la France Libre, puis des FFL, puis du CNR (1943).

## 4. Portée et limites

- **Portée** : acte fondateur d'une légitimité politique alternative à Vichy ; mythe rassembleur d'après-guerre.
- **Limites** : appel sans effet militaire immédiat, méconnu sur le moment, surévalué *a posteriori* par la mémoire gaulliste.

## 5. Conclusion

Ce discours fonde la **Résistance extérieure** et permettra, à la Libération, de présenter la France comme une nation ayant continué le combat. Il faut cependant nuancer son impact réel en juin 1940 et le distinguer de la **Résistance intérieure** qui se construira progressivement à partir de 1941.`,
  },
};
