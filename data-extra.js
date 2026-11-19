/* Pastry English Pro — données complémentaires (v5). © 2025 Tous droits réservés. */

/* ─── NOUVEAUX THÈMES DE VOCABULAIRE ─────────────────────────────── */
DB["Hygiene & Safety"] = [
    {fr:"La méthode HACCP",              en:"HACCP",                ex:"Our workshop follows the HACCP method."},
    {fr:"La contamination croisée",      en:"Cross-contamination",  ex:"Use separate boards to avoid cross-contamination."},
    {fr:"La date limite de consommation",en:"Use-by date",          ex:"Never sell a product past its use-by date."},
    {fr:"La date de durabilité minimale",en:"Best-before date",     ex:"Check the best-before date on the flour."},
    {fr:"Se laver les mains",            en:"Wash your hands",      ex:"Wash your hands before handling food."},
    {fr:"Les gants jetables",            en:"Disposable gloves",    ex:"Wear disposable gloves to serve the cakes."},
    {fr:"La charlotte",                  en:"Hairnet",              ex:"Always wear a hairnet in the workshop."},
    {fr:"Le tablier",                    en:"Apron",                ex:"Put on a clean apron."},
    {fr:"La tenue de travail",           en:"Work uniform",         ex:"Change into your work uniform."},
    {fr:"Désinfecter",                   en:"Disinfect",            ex:"Disinfect the worktop after use."},
    {fr:"Le plan de travail",            en:"Worktop",              ex:"Clean the worktop with a sanitizer."},
    {fr:"Le plan de nettoyage",          en:"Cleaning schedule",    ex:"Follow the cleaning schedule every day."},
    {fr:"La chaîne du froid",            en:"Cold chain",           ex:"Never break the cold chain."},
    {fr:"La traçabilité",                en:"Traceability",         ex:"Keep the labels for traceability."},
    {fr:"Le lave-mains",                 en:"Handwash basin",       ex:"Use the handwash basin, not the sink."},
    {fr:"La poubelle",                   en:"Bin",                  ex:"Put the waste in the bin."},
    {fr:"Le torchon",                    en:"Tea towel",            ex:"Dry the bowl with a clean tea towel."}
];

DB["Allergens"] = [
    {fr:"Les céréales contenant du gluten",en:"Cereals containing gluten",ex:"Bread and cakes are made with cereals containing gluten."},
    {fr:"Les crustacés",                 en:"Crustaceans",          ex:"Prawns and crabs are crustaceans."},
    {fr:"Les oeufs",                     en:"Eggs",                 ex:"Eggs are a common allergen in pastry."},
    {fr:"Le poisson",                    en:"Fish",                 ex:"Some gelatins are made from fish."},
    {fr:"Les arachides",                 en:"Peanuts",              ex:"Peanuts are not the same as tree nuts."},
    {fr:"Le soja",                       en:"Soybeans",             ex:"Soy lecithin comes from soybeans."},
    {fr:"Le lait",                       en:"Milk",                 ex:"Butter and cream contain milk."},
    {fr:"Les fruits à coque",            en:"Tree nuts",            ex:"Almonds and hazelnuts are tree nuts."},
    {fr:"Le céleri",                     en:"Celery",               ex:"Celery is also an allergen."},
    {fr:"La moutarde",                   en:"Mustard",              ex:"Mustard is rare in pastry but must be declared."},
    {fr:"Les graines de sésame",         en:"Sesame seeds",         ex:"Sesame seeds are used on some breads."},
    {fr:"Le dioxyde de soufre et sulfites",en:"Sulphur dioxide and sulphites",ex:"Dried fruit may contain sulphur dioxide and sulphites."},
    {fr:"Le lupin",                      en:"Lupin",                ex:"Lupin flour is used in some bakery products."},
    {fr:"Les mollusques",                en:"Molluscs",             ex:"Oysters and mussels are molluscs."}
];

DB["Textures & Units"] = [
    {fr:"Croustillant",                  en:"Crispy",               ex:"The craquelin makes the top crispy."},
    {fr:"Moelleux",                      en:"Soft and moist",       ex:"Madeleines should be soft and moist."},
    {fr:"Friable",                       en:"Crumbly",              ex:"Shortbread has a crumbly texture."},
    {fr:"Onctueux",                      en:"Creamy",               ex:"The pastry cream is smooth and creamy."},
    {fr:"Brillant",                      en:"Glossy",               ex:"The mirror glaze must look glossy."},
    {fr:"Aérien",                        en:"Light and airy",       ex:"A good sponge is light and airy."},
    {fr:"Fondant (en bouche)",           en:"Melt-in-the-mouth",    ex:"This ganache is melt-in-the-mouth."},
    {fr:"Collant",                       en:"Sticky",               ex:"The caramel is very sticky."},
    {fr:"Lisse",                         en:"Smooth",               ex:"Blend until the cream is smooth."},
    {fr:"Grumeleux",                     en:"Lumpy",                ex:"Whisk well to avoid a lumpy cream."},
    {fr:"Doré",                          en:"Golden brown",         ex:"Bake until golden brown."},
    {fr:"Tiède",                         en:"Lukewarm",             ex:"Use lukewarm milk for the yeast."},
    {fr:"Une pincée",                    en:"A pinch",              ex:"Add a pinch of salt."},
    {fr:"Une cuillère à soupe",          en:"Tablespoon",           ex:"Add one tablespoon of honey."},
    {fr:"Une cuillère à café",           en:"Teaspoon",             ex:"Add a teaspoon of vanilla extract."},
    {fr:"Un litre",                      en:"Litre",                ex:"Heat one litre of milk."},
    {fr:"Un kilogramme",                 en:"Kilogram",             ex:"Weigh one kilogram of flour."},
    {fr:"Les degrés Celsius",            en:"Degrees Celsius",      ex:"Bake at 180 degrees Celsius."}
];

/* ─── CORRECTION D'UNE TRADUCTION (description → terme) ──────────── */
(function fixTerms(){
    const t = DB_TRANS["Les Petits Fours"].find(x => x.fr === "Les diamants");
    if (t) { t.en = "Diamond cookies"; t.ex = "Roll the log in sugar before slicing the diamond cookies."; }
})();

/* ─── VARIANTES ACCEPTÉES DANS LE RUSH ET L'ÉPELLATION ───────────── */
const ALT = {
    "Caster sugar":["superfine sugar","castor sugar"],
    "Icing sugar":["powdered sugar","confectioners sugar"],
    "Brown sugar":["soft brown sugar"],
    "Cornstarch":["cornflour","corn flour"],
    "Liquid cream":["heavy cream","double cream","whipping cream"],
    "Unsalted butter":["sweet butter"],
    "Wholemeal flour":["whole wheat flour","wholewheat flour"],
    "Almond flour":["ground almonds","almond meal","almond powder"],
    "Hazelnut flour":["ground hazelnuts","hazelnut meal"],
    "Sliced almonds":["flaked almonds"],
    "Desiccated coconut":["shredded coconut","grated coconut"],
    "Raisins":["sultanas"],
    "Spatula":["rubber spatula","scraper"],
    "Bench scraper":["dough scraper","scraper"],
    "Stand mixer":["mixer","electric mixer"],
    "Food processor":["blender"],
    "Immersion blender":["hand blender","stick blender"],
    "Tart pan":["tart tin"],
    "Loaf pan":["loaf tin","cake tin"],
    "Cake ring":["entremet ring","cake mold","cake mould"],
    "Piping bag":["pastry bag"],
    "Baking tray":["baking sheet","sheet pan"],
    "Parchment paper":["baking paper","baking parchment"],
    "Fine sieve":["sieve","strainer","chinois"],
    "Sifter":["sieve","flour sifter"],
    "Water bath":["bain-marie","bain marie"],
    "Blowtorch":["blow torch","culinary torch","kitchen torch"],
    "Cookie cutter":["pastry cutter"],
    "Proof":["prove","let rise"],
    "Worktop":["counter","countertop","work surface"],
    "Bin":["trash can","waste bin","dustbin"],
    "Litre":["liter"],
    "Kilogram":["kilo","kg"],
    "Tablespoon":["tbsp","table spoon"],
    "Teaspoon":["tsp","tea spoon"],
    "Disinfect":["sanitize","sanitise"],
    "Soft and moist":["moist","soft and tender"],
    "Light and airy":["airy","light"]
};

/* ─── DIALOGUES DE VENTE EN PLUSIEURS RÉPLIQUES ──────────────────── */
const ROLEPLAY_MULTI = [
    {scene:"Nut Allergy", turns:[
        {ctx:"Customer: 'My daughter has a nut allergy. Is this brownie safe?'",
         opts:["Yes, it's probably fine.","I'm not sure, so let me check the ingredient list and ask the chef.","Nuts are only in the tarts."], ok:1,
         tip:"Never guess about allergens. Check the label or ask the chef."},
        {ctx:"Customer: 'Is it made in a kitchen that also uses nuts?'",
         opts:["Yes, our workshop handles nuts, so we can't guarantee there are no traces.","No, never.","Why does that matter?"], ok:0,
         tip:"Be honest about the risk of cross-contamination."}
    ]},
    {scene:"Gluten-Free Order", turns:[
        {ctx:"Customer: 'I have coeliac disease. Do you have anything gluten-free?'",
         opts:["Let me check which products are gluten-free and avoid any cross-contamination.","A little gluten won't hurt.","No."], ok:0,
         tip:"Coeliac customers need strict answers: verify, never guess."},
        {ctx:"Customer: 'Can you use a clean tray for my order?'",
         opts:["Absolutely. I'll use clean gloves and a clean tray.","That's too much trouble.","The tray is already clean."], ok:0,
         tip:"Offer reassuring, practical solutions."}
    ]},
    {scene:"Birthday Cake Order", turns:[
        {ctx:"Customer: 'I'd like to order a cake for Saturday.'",
         opts:["Come back tomorrow.","Saturday is closed.","Certainly. How many people is it for?"], ok:2,
         tip:"Accept the order and ask for the key details."},
        {ctx:"Customer: 'It's for twelve people. What flavours do you have?'",
         opts:["Look at the menu yourself.","We have chocolate, lemon and raspberry. Which would you prefer?","Just chocolate."], ok:1,
         tip:"Present your range and let the customer choose."},
        {ctx:"Customer: 'Chocolate, please. Can you write a message on it?'",
         opts:["No, we can't.","Of course! What would you like it to say?","Writing costs extra and I won't do it."], ok:1,
         tip:"Be flexible and confirm the details."}
    ]},
    {scene:"Long Wait", turns:[
        {ctx:"Customer: 'I've been waiting twenty minutes for my order!'",
         opts:["It's not my fault.","Please be patient.","I'm very sorry for the delay. I'll check right away."], ok:2,
         tip:"Apologise first, then act."},
        {ctx:"Customer: 'Can I get a discount for the wait?'",
         opts:["No way.","I'm afraid I can't, but I'd be happy to offer you a free coffee.","Ask the manager, I don't care."], ok:1,
         tip:"Stay polite and offer an alternative solution."}
    ]},
    {scene:"Phone Order", turns:[
        {ctx:"Caller: 'Hello, I'd like to order macarons for a party.'",
         opts:["Who's this?","Call back later.","Good morning, how can I help you? How many would you like?"], ok:2,
         tip:"Greet the caller and ask for the quantity."},
        {ctx:"Caller: 'Sixty, in assorted flavours, for next Friday.'",
         opts:["Certainly. Could I have your name and phone number, please?","Sixty is too many.","Friday doesn't work."], ok:0,
         tip:"Confirm the order and take the customer's details."}
    ]}
];
