import { Component, OnInit, ElementRef } from '@angular/core';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  private map: Map;
  private layer: VectorLayer;
  
  constructor(
    protected elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.createMap();
  }

  getMap(): Map {
    return this.map;
  }

  showLayer(layer: VectorLayer): void {
    if (this.layer) this.map.removeLayer(this.layer);
    this.layer = layer;
    this.map.addLayer(this.layer);
    this.map.getView().fit(this.layer.getSource().getExtent(), {
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
}
