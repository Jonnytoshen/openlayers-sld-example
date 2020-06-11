import { Component, OnInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, getPointResolution } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Subscription } from 'rxjs';

import * as SLDReader from '@nieuwlandgeo/sldreader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  formGroup: FormGroup
  customRequest = () => new Subscription();

  private map: Map;
  private layer: VectorLayer;
  
  constructor(
    protected elementRef: ElementRef,
    protected fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createMap();
    this.createFormGroup();
  }

  formGroupVallidator(): boolean {
    for(let i in this.formGroup.controls) {
      this.formGroup.controls[ i ].markAsDirty();
      this.formGroup.controls[ i ].updateValueAndValidity();
    }
    return this.formGroup.valid;
  }

  createLayer(): void {
    const { geojson, dataProjection, sld, name } = this.formGroup.value;
    const format = new GeoJSON();
    const featureProjection = 'EPSG:3857';
    const features = dataProjection === featureProjection 
      ? format.readFeatures(geojson)
      : format.readFeatures(geojson, { dataProjection, featureProjection });
    const source = new VectorSource({ features });
    const layer = new VectorLayer({ source });
    this.applySLD(layer, sld, name);
    if (this.layer) this.map.removeLayer(this.layer);
    this.layer = layer;
    this.map.addLayer(this.layer);
    this.map.getView().fit(source.getExtent(), {
      padding: [50, 50, 50, 50],
      duration: 1000
    });
  }

  private createMap(): void {
    const element = this.elementRef.nativeElement.querySelector('.app-map-view');
    this.map = new Map({
      view: new View({
        center: fromLonLat([107.138671875, 32.62087018318113]),
        zoom: 10
      }),
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      target: element
    });
  }

  private createFormGroup(): void {
    this.formGroup = this.fb.group({
      geojson: [null, [ Validators.required ]],
      dataProjection: ['EPSG:4326', [ Validators.required ] ],
      sld: [null, [ Validators.required ]],
      name: [null, [ Validators.required ]]
    });
  }

  private applySLD(layer: VectorLayer, text: string, name: string): void {
    const sldObject = SLDReader.Reader(text);
    const sldLayer = SLDReader.getLayer(sldObject);
    const style = SLDReader.getStyle(sldLayer, name);
    const featureTypeStyle = style.featuretypestyles[0];
    const viewProjection = this.map.getView().getProjection();

    layer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
      convertResolution: viewResolution => {
        const viewCenter = this.map.getView().getCenter();
        return getPointResolution(viewProjection, viewResolution, viewCenter);
      },
      imageLoadedCallback: () => {
        layer.changed();
      }
    }));
  }
}
