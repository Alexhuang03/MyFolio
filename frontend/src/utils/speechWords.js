/**
 * Vocabulaire courant par langue, pour reconnaître la langue des textes très courts
 * (« hello », « délicieux », « spicy »...), là où la détection statistique échoue.
 * Chargé à la demande avec la lecture à voix haute.
 */
const list = (words) => new Set(words.trim().split(/\s+/));

export const WORDS = {
  en: list(`
    the a an and or but is are was were be been it its this that these those there here
    i you he she we they me my your our their his her him them us
    of to in on at for with from by about into over under after before up down out off
    not no yes very so too also just only really much many more most some any all every
    do does did done have has had will would can could should may might must
    hello hi hey thanks thank please sorry welcome bye goodbye cheers ok okay
    good great nice best better bad fine love loved like liked awesome amazing perfect lovely
    tasty yummy yum delicious sweet sour salty spicy bitter hot cold warm fresh crispy crunchy creamy juicy tender
    easy quick simple hard fast slow healthy homemade favorite favourite classic
    food meal dish recipe breakfast lunch dinner dessert snack starter side drink
    chicken beef pork lamb fish shrimp egg eggs cheese butter milk cream bread rice pasta noodles
    flour sugar salt pepper oil garlic onion onions tomato tomatoes potato potatoes apple apples lemon
    water sauce soup salad cake pie cookie cookies chocolate honey vegetables fruit meat
    cup cups tbsp tsp tablespoon teaspoon pinch slice slices piece pieces bowl pan pot oven
    add mix stir bake boil fry cook cooked cut chop serve heat pour whisk season taste
    minute minutes hour hours until then next first second finally
    one two three four five six seven eight nine ten half
    day night today tomorrow morning evening week weekend family friends home
    what why how when where who which
    world book collection notes note item items buy bought price store shop
  `),
  fr: list(`
    le la les un une des du de et ou mais est sont était être été ce cet cette ces il elle ils elles
    je tu nous vous on me te se mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs
    au aux avec pour dans sur sous chez par sans entre vers après avant pendant depuis
    ne pas plus moins très trop peu bien beaucoup aussi encore déjà toujours jamais rien tout tous toute toutes
    oui non merci bonjour bonsoir salut coucou bienvenue pardon svp
    bon bonne bons bonnes meilleur meilleure excellent excellente parfait parfaite super génial génial adore adoré aime aimé
    délicieux délicieuse savoureux savoureuse sucré sucrée salé salée épicé épicée amer amère acide
    chaud chaude froid froide tiède frais fraîche croustillant croustillante fondant fondante moelleux moelleuse
    facile rapide simple difficile maison classique léger légère
    plat plats recette repas entrée dessert goûter apéritif boisson petit déjeuner dîner
    poulet bœuf boeuf porc agneau poisson crevettes œuf œufs oeuf oeufs fromage beurre lait crème pain riz pâtes nouilles
    farine sucre sel poivre huile ail oignon oignons tomate tomates pomme pommes citron
    eau sauce soupe salade gâteau tarte biscuit biscuits chocolat miel légumes fruit fruits viande
    tasse cuillère cuillères soupe café pincée tranche tranches morceau morceaux bol poêle casserole
    ajouter ajoutez mélanger mélangez remuer cuire cuisson faire fondre bouillir couper hacher servir chauffer verser fouetter goûter
    puis ensuite enfin jusqu quand comme
    deux trois quatre cinq six sept huit neuf dix demi moitié
    jour nuit aujourd hui demain matin soir semaine famille amis
    quoi pourquoi comment où qui quel quelle
    monde livre collection note notes élément éléments acheter acheté prix magasin
  `),
  es: list(`
    el los las y o pero es son está están con para por del al muy bueno buena rico rica delicioso deliciosa
    hola gracias adiós sí también más menos todo nada fácil comida receta pollo queso arroz sal azúcar
  `),
  it: list(`
    il lo gli e o ma è sono con per della dello degli molto buono buona buonissimo delizioso deliziosa
    ciao grazie anche più meno tutto facile cibo ricetta pollo formaggio riso sale zucchero
  `),
  de: list(`
    der die das und oder aber ist sind mit für von zum zur sehr gut gute lecker schmeckt
    hallo danke tschüss auch mehr weniger alles einfach essen rezept hähnchen käse reis salz zucker
  `),
  pt: list(`
    o os as e ou mas é são com para do da dos das muito bom boa gostoso gostosa delicioso deliciosa
    olá obrigado obrigada também mais menos tudo fácil comida receita frango queijo arroz sal açúcar
  `),
  nl: list(`
    de het een en of maar is zijn met voor van heel erg goed lekker hallo dank bedankt ook meer
    alles makkelijk eten recept kip kaas rijst zout suiker
  `),
};

// Terminaisons typiques, pour départager des mots absents du vocabulaire
export const ENDINGS = {
  en: /(ing|ness|ful|less|ly|ck|sh|th|ow|ee|oo|ght|y|w)$/,
  fr: /(eau|eaux|eux|euse|ette|oir|oire|ée|é|ais|ait|ment|ière|ier|ique|eur)$/,
  es: /(ción|ado|ada|ito|ita|mente)$/,
  it: /(zione|ino|ina|etto|etta|issimo)$/,
  de: /(ung|keit|heit|lich|chen|sch)$/,
  pt: /(ção|ões|inho|inha|mente)$/,
  nl: /(heid|lijk|tje|ijk)$/,
};
