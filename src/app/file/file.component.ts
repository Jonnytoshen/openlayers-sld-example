import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { UploadChangeParam } from 'ng-zorro-antd/upload';

import { GeoJSON } from 'ol/format';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { getPointResolution } from 'ol/proj';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import { AppComponent } from '../app.component';

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.less']
})
export class FileComponent implements OnInit {

  customRequest = () => new Subscription();
  geojson: File;
  styleSld: File;

  constructor(
    protected app: AppComponent
  ) { }

  ngOnInit(): void {
  }

  onGeoJSONChange($event: UploadChangeParam): void {
    this.geojson = $event.file.originFileObj;
  }

  onStyleSldChange($event: UploadChangeParam): void {
    this.styleSld = $event.file.originFileObj;
  }

  removeGeoJSONFile(): void {
    this.geojson = null;
  }

  removeStyleSldFile(): void {
    this.styleSld = null;
  }

  onClickAddLayerButton(): void {
    if (!(this.geojson && this.styleSld)) return;
    zip(this.readFile(this.geojson), this.readFile(this.styleSld))
      .subscribe(([ geojson, sld ]) => this.createLayer(geojson, sld));
  }

  private createLayer(geojson: string, sld: string): void {
    const format = new GeoJSON();
    const dataProjection = 'EPSG:4326';
    const featureProjection = 'EPSG:3857';
    const features = format.readFeatures(geojson, { dataProjection, featureProjection });
    const source = new VectorSource({ features });
    const layer = new VectorLayer({ source });
    this.applySLD(layer, sld, 'XZQH_liaoning');
    this.app.showLayer(layer);
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

  private readFile(file: File): Observable<string> {
    const reader = new FileReader();
    return new Observable((observer) => {
      reader.addEventListener('loadend', (event: ProgressEvent) => {
        const fileReader: FileReader = event.target as FileReader;
        observer.next(fileReader.result as string);
        observer.complete();
    });
    reader.readAsText(file);
    });
  }

}
