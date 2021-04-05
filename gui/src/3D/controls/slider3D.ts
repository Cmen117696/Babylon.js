import { Observable } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Control3D } from "./control3D";
import { MeshBuilder } from "babylonjs/Meshes/meshBuilder";
import { PointerDragBehavior } from "babylonjs/Behaviors/Meshes/pointerDragBehavior";
import { Material } from "babylonjs/Materials/material";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Color3 } from "babylonjs/Maths/math.color";
import { AbstractMesh } from "babylonjs/Meshes/index";

export interface ISlider3DOptions {
    minimum?: number,
    maximum?: number,
    value?: number
};

/**
 * Class used to create a slider in 3D
 */
 export class Slider3D extends Control3D {
    private _sliderBarMaterial: Material;
    private _sliderThumbMaterial: Material;
    private _sliderThumb: Mesh;
    private _sliderBar: Mesh;

    private _minimum: number;
    private _maximum: number;
    private _value: number;

    /** Observable raised when the sldier value changes */
    public onValueChangedObservable = new Observable<number>();

    /**
     * Creates a new slider
     * @param name defines the control name
     */
     constructor(name?: string, options?: ISlider3DOptions) {
        super(name);

        this._minimum =  options?.minimum ? options.minimum : 0;
        this._maximum = options?.maximum ? options.maximum : 100;
        this.value = options?.value ? options.value : 50;       
    }    

    /** Gets or sets minimum value */
    public get minimum(): number {
        return this._minimum;
    }

    public set minimum(value: number) {
        if (this._minimum === value) {
            return;
        }

        this._minimum = Math.min(value, this._maximum);
        this.value = this._value;
    }

     /** Gets or sets maximum value */
     public get maximum(): number {
         return this._maximum;
     }
 
     public set maximum(value: number) {
         if (this._maximum === value) {
             return;
         }
 
         this._maximum = Math.max(value, this._minimum);
         this.value = this._value;
     }

    /** Gets or sets current value */
    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        value = Math.max(Math.min(value, this._maximum), this._minimum);

        if (this._value === value) {
            return;
        }

        this._value = value;
        this.onValueChangedObservable.notifyObservers(value);
    }

    protected get start(): number{
        if(!this.node){
            return -1;
        }

        return this._sliderBar.position.x - this._sliderBar.scaling.y / 2;
    }

    protected get end(): number{
        if(!this.node){
            return 1;
        }

        return this._sliderBar.position.x + this._sliderBar.scaling.y / 2;
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        const anchor = new AbstractMesh(`${this.name}_slider`, scene);    
        
        this._sliderBar = MeshBuilder.CreateCylinder(`${this.name}_sliderbar`, { diameter: 0.03, height: 1.0 }, scene);
        this._sliderBar.rotation.z = -Math.PI / 2;
        this._sliderBar.scaling.y = 2;
        this._sliderBar.isPickable = false;
        this._sliderBar.setParent(anchor);

        this._sliderThumb = MeshBuilder.CreateBox(`${this.name}_sliderthumb`, { size: 0.1 }, scene);
        this._sliderThumb.scaling = new Vector3(2, 2, 2);
        this._sliderThumb.position.x = this._convertToPosition(this.value);
        this._sliderThumb.addBehavior(this._createBehavior());
        this._sliderThumb.setParent(anchor);

        return anchor;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        this._sliderBarMaterial = this._createBarMaterial(mesh.getScene());
        this._sliderBar.material = this._sliderBarMaterial;

        this._sliderThumbMaterial = this._createThumbMaterial(mesh.getScene());
        this._sliderThumb.material =  this._sliderThumbMaterial;
    }
    
    private _createBarMaterial(scene: Scene): Material {
        const material  =  new StandardMaterial(`${this.name}_sliderbar_material`, scene);
        material.specularColor = Color3.Black();

        return material;       
    }

    private _createThumbMaterial(scene: Scene): Material {
        const material  =  new StandardMaterial(`${this.name}_sliderthumb_material`, scene);
        material.specularColor = Color3.Black();

        return material;       
    }

    private _createBehavior(): PointerDragBehavior {
        const pointerDragBehavior = new PointerDragBehavior({ dragAxis: new Vector3(1, 0, 0) });
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragObservable.add((event) => {
            const position = this._sliderThumb.position.x + event.dragDistance;
            this._sliderThumb.position.x = Math.max(Math.min(position, this.end), this.start);
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            const value = Math.round((this._sliderThumb.position.x - this.start) / (this.end - this.start) * (this.maximum - this.minimum));
            this.value = Math.min(Math.max(this.minimum + value, this.minimum), this.maximum);
        });

        return pointerDragBehavior;
    }

    private _convertToPosition(value: number): number {
        const distance = (value - this.minimum) / (this.maximum - this.minimum) * (this.end - this.start);
        return Math.min(Math.max(this.start + distance, this.start), this.end); 
    }

    /**
     * Releases all associated resources
     */
     public dispose() {
        super.dispose();

        if(this._sliderBar){
            this._sliderBar.dispose();
        }

        if(this._sliderThumb){
            this._sliderThumb.dispose();
        }

        if(this._sliderBarMaterial){
            this._sliderBarMaterial.dispose();
        }

        if(this._sliderThumbMaterial){
            this._sliderThumbMaterial.dispose();
        }        
    }    
 }