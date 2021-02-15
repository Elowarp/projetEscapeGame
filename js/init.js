import * as THREE from "https://threejs.org/build/three.module.js";
import { PointerLockControls } from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'https://threejs.org/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://threejs.org/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://threejs.org/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'https://threejs.org/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'https://threejs.org/examples/jsm/shaders/FXAAShader.js';

const openLaptop = function (){
    afficheAEcran = "laptop";
    controls.unlock()
    let screen = document.getElementById("laptop")
    screen.style.display = "";
    
}

const openCoffre = function (){
    console.log("Coffre")
}

const removeTapis = function (){
    console.log("Tapis")
}

const openDoor = function (){
    console.log("Door")
}

const getCle = function (){
    console.log("Cle")
}

const openTrappe = function (){
    console.log("Trappe")
}

const controlLock = function (){
    controls.lock()
}

const unlockDoor = function (){ 
    usable.forEach(element => {
        if (element.name == "Door"){
            element.userData.blocked = false
        }
    })
}

/*
    Variables
*/
var camera, scene, renderer, controls;
let composer, effectFXAA, outlinePass;
let selectedObjects;
let level = 2;
let afficheAEcran;

const collisions = [];
const usable = [];

const actionsByPlayer = {
    "openLaptop": openLaptop,
    "openCoffre": openCoffre,
    "removeTapis": removeTapis,
    "openDoor": openDoor,
    "getCle": getCle,
    "openTrappe": openTrappe,
};

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

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

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize );

    //Hauteur du personnage
    camera.position.y = 7.5
    
    //Couleur de fond
    scene.background = new THREE.Color( 0x82898f );

    //Gestion du post processing (Le contour des objets)
    composer = new EffectComposer( renderer );

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
    const dot = document.getElementById('dot')

    instructions.addEventListener( 'click', function () {
        controls.lock();
    } );

    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
        dot.style.display = '';

    } );
    controls.addEventListener( 'unlock', function () {
        if (afficheAEcran != "laptop"){
            blocker.style.display = 'block';
            instructions.style.display = '';
            dot.style.display = 'none';
        }
    } );

    window.addEventListener("blur", () => {
        blocker.style.display = 'block';
        instructions.style.display = '';
        dot.style.display = 'none';
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
            detectCollision(obj);
            setTexture(obj)
            scene.add( obj );
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

        if (vec.y >= -0.95 && vec.y <= 0.95){
            vectors[i] = camera.localToWorld(vectors[i])
            vectors[i].sub(camera.position)
            
            camera.localToWorld(cameraPos)
            cameraPos.y = 4;
            vectors[i].y = 0;

        } else {
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
        outlineObjects(intersects[0].object);

    } else {
        outlineObjects();

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

export {controlLock, unlockDoor}