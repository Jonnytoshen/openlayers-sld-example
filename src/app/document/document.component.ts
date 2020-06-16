import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getPointResolution } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import { AppComponent } from '../app.component';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.less']
})
export class DocumentComponent implements OnInit {

  formGroup: FormGroup;

  constructor(
    protected fb: FormBuilder,
    protected app: AppComponent
  ) { }

  ngOnInit(): void {
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
    this.app.showLayer(layer);
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
    const map = this.app.getMap();
    const viewProjection = map.getView().getProjection();

    layer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
      convertResolution: viewResolution => {
        const viewCenter = map.getView().getCenter();
        return getPointResolution(viewProjection, viewResolution, viewCenter);
      },
      imageLoadedCallback: () => {
        layer.changed();
      }
    }));
  }

}
