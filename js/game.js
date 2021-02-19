import * as THREE from "https://threejs.org/build/three.module.js";
import { PointerLockControls } from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'https://threejs.org/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://threejs.org/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://threejs.org/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'https://threejs.org/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'https://threejs.org/examples/jsm/shaders/FXAAShader.js';

const openLaptop = function (){
    /*
        Fonction appelé quand on clic sur l'ordinateur
    */

    afficheAEcran = "laptop";

    controls.unlock()

    let screen = document.getElementById("laptop")
    screen.style.display = "";

}

const openCoffre = function (){
    /*
        Fonction appelé quand on clic sur le coffre
    */

    afficheAEcran = "coffre";

    controls.unlock();

    currentHint = 1

    let coffre = document.getElementById("coffre");
    coffre.style.display = "";
}

const removeTapis = function (){
    /*
        Fonction appelé quand on clic sur le tapis
    */

    let tapis = scene.getObjectByName("Tapis");

    //On supprime le tapis de la scène
    tapis.parent.remove(tapis)
    tapis.geometry = undefined;
    tapis.material = undefined;

    //On regarde quel indice on doit mettre en fonction de l'état de la trappe(ouverte ou non)
    let trappe = scene.getObjectByName("Trappe")
    if (trappe.userData.blocked == false){
        currentHint = 2
    } else {
        currentHint = 1
    }

    changeMessage("Oh... Une trappe cachée", false, true)

    animate();
}

const openDoor = function (){
    /*
        Fonction appelé quand on clic sur la porte
    */

    let door = scene.getObjectByName("Door");
    if (door.userData.blocked == false){
        changeLevel();
        door.userData.blocked = true;

    } else {
        changeMessage("Mince c'est fermé, il faut que je trouve un\
         moyen de l'ouvrir...", false, true)
         
    }
}

const getCle = function (){
    /*
        Fonction appelé quand on clic sur la clé
    */

    //On défini l'indice en fonction de l'état du tapis (enlevé ou non)
    let tapis = scene.getObjectByName("Tapis")
    if(tapis == undefined){
        currentHint = 2

    } else {
        currentHint = 0

    }

    //On enleve la clé de la vue du joueur
    let cle = scene.getObjectByName("Key");
    cle.visible = false;

    //On ouvre la trappe
    let trappe = scene.getObjectByName("Trappe")
    trappe.userData.blocked = false;

    changeMessage("Oui ! J'ai la clé !", false, true)
}

const openTrappe = function (){
    /*
        Fonction appelé quand on clic sur la trappe
    */

    let trappe = scene.getObjectByName("Trappe")

    //Si la trappe est ouverte alors on lance la fin du jeu
    if (!trappe.userData.blocked){
        endGame();

    } else {
        changeMessage("Mince c'est fermé, il faut que je trouve un\
         moyen de l'ouvrir...", false, true)
        
    }
}

const controlLock = function (){
    /*
        Fonction permettant de prendre le curseur (pour être utilisé en dehors du module)
    */

    controls.lock();
    afficheAEcran = "";
}

const unlockDoor = function (){ 
    /*
        Fonction permettant de debloquer la porte (pour être utilisé en dehors du module)
    */

    let door = scene.getObjectByName("Door")
    door.userData.blocked = false;

}

/*
    Variables
*/
var camera, scene, renderer, controls;
let composer, effectFXAA, outlinePass;
let selectedObjects;
let level = 1;
let currentHint = 0;
let afficheAEcran;

let environment;

let timeLastIndice;

let collisions = [];
let usable = [];

const actionsByPlayer = {
    "openLaptop": openLaptop,
    "openCoffre": openCoffre,
    "removeTapis": removeTapis,
    "openDoor": openDoor,
    "getCle": getCle,
    "openTrappe": openTrappe,
};


//Liste des indices
// Tableau à 2 entrées = 1e : Le niveau ; 2e : l'indice qui correpond
const hints = [[
        "Tu peux essayer de trouver le coffre fort !",
        "Tu peux essayer de trouver le code du coffre\
        sous un des posters...",
        "Tu peux ouvrir la porte maintenant !"
    ],
    [
        "Tu peux essayer de trouver le code de l'ordinateur sur un des post-it...",
        "Cherche bien dans tous les dossiers de l'ordinateur pour trouver le fichier\
         hackant la porte...",
        "Tu peux ouvrir la porte maintenant qu'elle est ouverte !"
    ],
    [
        "Regarde au sol s'il n'y a pas quelque chose de cachée...",
        "Tu peux essayer de trouver une clé du côté des cartons...",
        "Tu peux maintenant passer à travers la trappe !"
    ]
]

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const direction = new THREE.Vector3();

init();
animate();

function init(){
    /*
        Initialisation du jeu
    */

    //
    //  Création du context
    //
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
        0.1, 1000);

    //On gère le rendu de l'image
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    //On ajoute le canva à la page
    document.body.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize );

    //Hauteur du personnage
    camera.position.y = 7.5
    
    //Couleur de fond
    scene.background = new THREE.Color( 0x82898f );

    //Gestion du post processing (Le contour des objets)
    composer = new EffectComposer( renderer );

    //
    //  Gestion du postprocessing (le contour des objets)
    //
    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    composer.addPass( outlinePass );

    effectFXAA = new ShaderPass( FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    composer.addPass( effectFXAA );


    //    Gestion du curseur,
    //        Curseur prit par la fenêtre quand on clique
    //        sur la fénêtre.

    controls = new PointerLockControls( camera, document.body );
    scene.add( controls.getObject() );

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );
    const dot = document.getElementById('dot');
    const cofffre = document.getElementById("coffre");
    const laptop = document.getElementById("laptop");

    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
        dot.style.display = '';
        laptop.style.display = "none";
        coffre.style.display = "none";

    });

    controls.addEventListener( 'unlock', function () {
        if (afficheAEcran == ""){
            blocker.style.display = 'block';
            instructions.style.display = '';
            dot.style.display = 'none';
        }
    } );

    window.addEventListener("blur", () => {
        controls.unlock()
    })

    document.addEventListener('click', function(){
        if(controls.isLocked === true){
            if(selectedObjects.length > 0){
                actionsByPlayer[selectedObjects[0].userData.action]()
            }
        }
    })


    /*
        Gestion des touches
    */
    const onKeyDown = function ( event ) { //On appuie sur la touche donc on active l'action qui va
        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
        }
    };
    const onKeyUp = function ( event ) { //On relâche la touche donc on arrête l'action qu'on faisait
        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

        }
    };
    
    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );


    /*
        Création de la scene
    */

    //Ajout scène crée dans l'editeur de threejs.org
    const loader = new THREE.ObjectLoader();
    loader.load(
        //Modèle JSON à charger
        "models/scene.json",

        //Callback : une fois le chargement fini
        function ( obj ) {
            environment = obj;

            //On défini la scène avec les objets chargés
            detectCollision(environment);
            setTexture(environment);

            //On l'ajoute à la scène
            scene.add(environment);

            //On affiche le menu
            showMenu();
        },

        //Callback : pendant le chargement
        () => {},

        //Callback : erreur pendant le chargement
        function ( err ) {
            console.error( 'Error : ', err );
        }
    );
}

function onWindowResize() {
    /*
        On change les paramètres d'affichage de la page pour qu'elle s'adapte à la nouvelle taille
        en cas de reduction de fenêtre.
    */
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function detectCollision(scene){
    /*
        Ajout de chaque mesh de la scène dans le tableau collision
        et ajout des objets utilisables dans le tableau usable
    */

    //On reinitialise le compteur des indices
    timeLastIndice = new Date;
    currentHint = 0;

    for(let i = 0; i < scene.children.length; i++){
        //Si on a un mesh
        if (scene.children[i].type == "Mesh"){
            if (scene.children[i].userData.collision === true){ //Test pour savoir si l'objet à une collision
                collisions.push(scene.children[i])

            }

            if (scene.children[i].userData.usable === true){ //Test pour savoir si l'objet est utilisable
                if(scene.children[i].userData.level.includes(level)){ //Test pour savoir si on active l'objet pour ce niveau
                    usable.push(scene.children[i])

                }
                
            }

        } else if (scene.children[i].type == "Group"){ //Ou si c'est un groupe
            //On regarde chaque élément du groupe
            for (let j = 0; j < scene.children[i].children.length; j++){
                if (scene.children[i].children[j].userData.collision === true){ //Test pour savoir si l'objet à une collision
                    collisions.push(scene.children[i].children[j])

                } 

                if (scene.children[i].children[j].userData.usable === true) { //Test pour savoir si l'objet est utilisable
                    if(scene.children[i].children[j].userData.level.includes(level)){ //Test pour savoir si on active l'objet pour ce niveau
                        usable.push(scene.children[i].children[j])

                    }
                }
            }
        }

        
    }
}

function setTexture(scene){
    /*
        Définition des caractérisques spéciales de certaines textures
    */

    //On liste exhaustivement tous les meshes que l'on doit modifier
    scene.children.forEach(element => {
        switch(element.name){
            case "Sol":
                //Modification du nombre de fois la texture est répétée
                element.material.map.wrapS = element.material.map.wrapT = THREE.RepeatWrapping;
                element.material.map.repeat.set( 3, 3 );
                break;

            case "Walls":
                //On utilise une boucle car les 4 murs sont réunis dans un groupe
                for (let i = 0; i < element.children.length; i++){
                    element.children[i].material.map.wrapS = element.children[i].material.map.wrapT = THREE.RepeatWrapping;
                    element.children[i].material.map.repeat.set( 2.5, 1.5 );

                }
                break;

            default:
                break;
        }
    });
}

function movePerson(){
    /*
        Gestion du déplacement du personnage
    */
    if ( controls.isLocked === true) { //Si le curseur est prit dans le jeu donc qu'il joue

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // On transforme le vecteur en vecteur unitaire

        controls.moveRight(direction.x * 0.5);
        controls.moveForward(direction.z * 0.5);
    }
}

function animate() {
    /*
        Code exécuté à chaque image affiché par le jeu
    */
    requestAnimationFrame( animate ); //Récursion

    // Collisions
    collisionsTest();

    //Aura autour de certains objets utilisable
    detectUsableObjects();

    //Mouvement du personnage
    movePerson()

    //On regarde si on peut donner un indice au joueur
    giveIndice()

    //On fait le rendu de la scène
    renderer.render( scene, camera );
    composer.render();
}

function collisionsTest(){
    /*
        Test des collisions du personnage, évite de traverser les murs et les objets dont on ne veut pas qu'il traverse
    */
    //Vecteurs utilisés par le raycaster pour detecter tout les objets à gauche, devant, à droite et derrière
    let vectors = [
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(-1, 0, 0)
    ]

    //Boucle s'exécutant sur la liste des vecteurs
    for (let i = 0; i < vectors.length; i++){
        let cameraPos = new THREE.Vector3();

        //On modifie le vecteur pour l'adapter à notre caméra et au raycaster
        let vec = new THREE.Vector3()
        vec = camera.getWorldDirection(vec)

        //On regarde si le joueur ne regarde pas vers le haut ou vers le bas
        //  (bug de collision, si on regarde vers le bas/haut on traverse les murs avec une certaine
        //   position)
        //  Le bug est connu mais je ne sais pas comment le regler avec les raycaster
        if (vec.y >= -0.95 && vec.y <= 0.95){
            //Si c'est le cas alors on fait suivre les raycater selon l'orientation du joueur
            vectors[i] = camera.localToWorld(vectors[i])
            vectors[i].sub(camera.position)
            
            camera.localToWorld(cameraPos)
            cameraPos.y = 4;
            vectors[i].y = 0;

        } else {
            //Sinon on prend des valeurs définies (haut-droite-bas-gauche) ce que nous permet
            //  de faire des collisions malgrés le bug
            camera.localToWorld(cameraPos)
            cameraPos.y = 4;

        }
         
        let ray = new THREE.Raycaster( cameraPos, vectors[i]);
        let intersects = ray.intersectObjects( collisions );

        //On teste si le raycaster trouve quelque chose sur un des vecteurs
        //  et on regarde si la distance avec lui est en dessous de 5
        //  Si oui alors on arrete de bouger le personnage
        if ( intersects.length > 0 && intersects[ 0 ].distance < 5){
            //Switch pour détecter quel coté bloquer en fonction du vecteur utilisé dans la boucle
            //  (obligé d'utilliser ça si je voulais mettre tout le code dans une boucle)
            switch(i){
                case 0:
                    moveForward = false
                    break;
                case 1:
                    moveRight = false;
                    break;
                case 2:
                    moveBackward = false;
                    break;
                case 3:
                    moveLeft = false;
                    break;
            }
        }
    }
}

function detectUsableObjects(){
    /*
        Gestion de la detection des objets qui sont visés par le joueur
    */
    let vector = new THREE.Vector3(0, 0, -1); //Vecteur signifiant l'orientation de la tête du personnage

    vector = camera.localToWorld(vector)
    vector.sub(camera.position)

    //Raycaster des objets se trouvant dans la visé du joueur et qui sont dans le tableau usable
    let ray = new THREE.Raycaster( camera.position, vector)
    let intersects = ray.intersectObjects(usable)

    //Test de si on détecte bien un mesh ET qu'il se trouve à moins de 19
    if (intersects.length > 0 && intersects[0].distance < 19){
        outlineObjects(intersects[0].object) //On fait le contour de l'objet

    } else {
        outlineObjects(); //On supprime le contour des objets

    }

}

function outlineObjects(selectedObject){
    /*
        Ajout d'un contour à un objet sur la scène
    */
    let color = new THREE.Color(0xff0000)
    if (selectedObject != null){ //Si on nous donne un objet à contourer
        selectedObjects = []; //Liste des objets à coutourer (Taille toujours égale à 0 ou 1 pour notre jeu)
        

        if (selectedObject.type == "Group"){ 
            //On parcourt le groupe entier jusque trouver l'objet à coutourer que 
            //  l'on ajoute au tableau selectedObjects
            for(let i = 0; i < selectedObject.children.length; i++){
                if(selectedObject.children[i].userData.usable === true){   
                    selectedObjects.push(selectedObject.children[i])
                    break;
                }

            }

        } else {
            //Si on a directement le mesh on l'ajoute au tableau
            selectedObjects.push( selectedObject );
        }
        if(selectedObjects[0].userData.blocked){
            color = new THREE.Color(0xff0000)
        } else {
            color = new THREE.Color(0xffffff)
        }
    } else {
        //On supprime tous les objets coutourés
        selectedObjects = []
    }

    //On affecte la nouvelle liste aux objets à coutourer
    outlinePass.visibleEdgeColor = color
    outlinePass.selectedObjects = selectedObjects;
}

function changeLevel(){
    /*
        Fonction permettant de changer de niveau de jeu
    */

    //On augmente le niveau
    level++;

    //On affiche au premier plan la page de transition
    let transition = document.getElementById("transition")
    transition.style.zIndex = 3;

    //On fait un fondu entrant de la page de transition
    fadeIn(transition, 1, () => {

        //On change le message dans la boite aux messages
        changeMessage("Tu es vraiment fort, voyons si tu\
         arrives à sortir de cette salle")

        //On repositionne la camera au centre du bureau
        controls.getObject().position.set(0, 7.5, 0);
        controls.getObject().rotation.set(0, 0, 0);

        //On fait un fondu sortant de la page de transition
        fadeOut(transition, 1, () => {
            //On replace la page de transition au même niveau que les autres pages
            transition.style.zIndex = 0;
        })

    })
    
    //On supprime les objets utilisables car ils vont probablements changer avec le niveau et on les redifini 
    usable = [];
    detectCollision(environment);
}

function endGame(){
    /*
        Fonction affichant l'écran de fin
    */
    //On rend visible l'écran de fins
    let endScreen = document.getElementById("endGame")
    endScreen.hidden = false;

    //On fait un fondu entrant
    fadeIn(endScreen, 3, () => {})
}

function showMenu(){
    /*
        Fonction affichant le bouton lançant le jeu
    */

    //On met la bar de chargement à 100%
    let progressBar = document.getElementById("loadingGameBar")
    progressBar.style.width = "100%";

    //On rend visible le bouton
    let startScreen = document.getElementById("startScreen")
    startScreen.hidden = false

    //On fait un fondu sortant de la bar de chargement puis on fait un fondu entrant du bouton
    fadeOut(progressBar.parentNode.parentNode, 10, () => {
        fadeIn(startScreen, 10, () => {})
    })

}

function fadeOut(element, time, callback){
    /*
        Fait un fondu sortant de n'import quel élément avec un temps défini
            et avec un callback pour quand on a fini la transition
    */
    let opacity = 1;

    var fadeOutInterval = setInterval(() => {
        element.style.opacity = opacity;

        if (opacity <= 0){ //On regarde si on atteint la limite de l'opacité possible [0;1]
            //On arrête le décompte et on exécute le callback
            clearInterval(fadeOutInterval)
            callback()

        }

        opacity -= 0.01;
    }, time)
}

function fadeIn(element, time, callback){
    /*
        Fait un fondu entrant de n'importe quel élément avec un temps défini 
            et avec un callback pour quand on a fini la transition
    */

    let opacity = 0;

    var fadeInInterval = setInterval(() => {
        element.style.opacity = opacity;

        if (opacity >= 1){ //On regarde si on atteint la limite de l'opacité possible [0;1]
            //On arrête le décompte et on exécute le callback
            clearInterval(fadeInInterval)
            callback()
        }

        opacity += 0.01;
    }, time)
}

function changeMessage(text, hint=false, player=false){
    /*
        Affiche un nouveau message dans boite aux messages
    */

    //On récupère le dernier message dans la boite 
    let message = document.getElementById("message");

    //On le cache pour le changer
    fadeOut(message, 1, () => {
        
        //On redefini le css et le message en fonction de la personne parlant
        if (hint){
            message.classList += "message hint";
            text = "Indice : " + text;

        } else if(player) {
            message.classList = "message player";
            text = "Vous : " + text;

        }else{
            message.classList = "message";
            text = "Patronne Veripasur : " + text
        }

        message.innerText = text

        //On raffiche le message
        fadeIn(message, 1, () => {})
    })
}

function giveIndice(){
    /*
        Fonction envoyant un indice au joueur tout les 45 secondes s'il est bloqué
    */

    //On test si depuis la dernière fois qu'on a donné un indice/fait une action
    // il s'est écoulé +45 secondes
    let now = new Date; 
    if(Math.round((now - timeLastIndice) / 1000) > 40){

        //On redifini la valeur de l'heure du dernier indice
        timeLastIndice = now;

        //On affiche l'indice dans boite aux messages
        changeMessage(hints[level - 1][currentHint], true)
    }
}

function changeHint(hint){
    /*
        Change la valeur de la variable hint (utilisé pour l'appel
            en dehors du module)
    */
    currentHint = hint
}

export {controlLock, unlockDoor, fadeIn, fadeOut, changeMessage, changeHint}