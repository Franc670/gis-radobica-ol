import "ol/ol.css";
import { Map, View, Overlay } from "ol";
import { Tile, Group } from "ol/layer";
import { TileWMS } from "ol/source";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { GeoJSON } from "ol/format";
import { FullScreen, ScaleLine, defaults } from "ol/control";
import data from "./data/vector_data/map.geojson";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import Geolocation from "ol/Geolocation";

//EPSG:5514 addition of coordinate system
proj4.defs(
  "EPSG:5514",
  "+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs"
);
register(proj4);

//prepare data for configuration of WMTS services
const resolutionAtZoom0 = 1219.15504015788532;
const resolutionsZbgis = new Array(12);
const matrixIdsZbgis = new Array(12);

for (let i = 0; i < 12; i++) {
  matrixIdsZbgis[i] = i.toString();
  resolutionsZbgis[i] = resolutionAtZoom0 / Math.pow(2, i);
}

const resolutionsOrtho = new Array(13);
const matrixIdsOrtho = new Array(13);

for (let i = 0; i < 13; i++) {
  matrixIdsOrtho[i] = i.toString();
  resolutionsOrtho[i] = resolutionAtZoom0 / Math.pow(2, i);
}

//create main Map object
const map = new Map({
  target: "map",
  controls: defaults({
    rotate: false,
    zoom: true,
    zoomOptions: { zoomInTipLabel: "Priblížiť", zoomOutTipLabel: "Oddialiť" },
    attribution: true,
    attributionOptions: { tipLabel: "Autor zdrojových údajov" },
  }),
  view: new View({
    projection: "EPSG:5514",
    center: [-466497.5, -1241628.9],
    zoom: 15,
    //maxZoom: 22,
    extent: [-467995.6, -1244285.1, -462743.3, -1240054.0],
  }),
  keyboardEventTarget: document,
});

//initialize base maps
const orthophotoMapLayer = new Tile({
  source: new WMTS({
    attributions: "© ÚGKK SR, MPaRV SR, GKÚ, NLC Zvolen",
    requestEncoding: "REST",
    url: "https://zbgisws.skgeodesy.sk/zbgis_ortofoto_wmts/service.svc/get/tile/1.0.0/WMS_zbgis_ortofoto_wmts/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}",
    layer: "WMS_zbgis_ortofoto_wmts",
    matrixSet: "default028mm",
    style: "default",
    tileGrid: new WMTSTileGrid({
      origin: [-33699800, 33699800],
      resolutions: resolutionsOrtho,
      matrixIds: matrixIdsOrtho,
    }),
  }),
  visible: true,
  title: "orthophotoMap",
});

const zbgisLayer = new Tile({
  source: new WMTS({
    attributions: "© Úrad geodézie, kartografie a katastra SR",
    requestEncoding: "REST",
    url: "https://zbgisws.skgeodesy.sk/zbgis_wmts_new/service.svc/get/tile/1.0.0/WMS_zbgis_wmts_new/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}",
    layer: "WMS_zbgis_wmts_new",
    matrixSet: "default028mm",
    style: "default",
    tileGrid: new WMTSTileGrid({
      origin: [-33699800, 33699800],
      resolutions: resolutionsZbgis,
      matrixIds: matrixIdsZbgis,
    }),
  }),
  visible: false,
  title: "zbgis",
});

// add base maps to layer group
const baseMapsGroup = new Group({
  layers: [zbgisLayer, orthophotoMapLayer],
});
map.addLayer(baseMapsGroup);

//logic for base map radio button
const baseMapsAllRadioButtons = document.querySelectorAll(
  ".sidebar-layers-container > input[type = radio]"
);
for (let baseMapRadioButton of baseMapsAllRadioButtons) {
  baseMapRadioButton.addEventListener("change", function () {
    let baseMapRadioButtonValue = this.value;
    baseMapsGroup.getLayers().forEach(function (element) {
      let baseMapTitle = element.get("title");
      element.setVisible(baseMapTitle === baseMapRadioButtonValue);
    });
  });
}

//initialize tile layers
const esknRegisterC = new Tile({
  source: new TileWMS({
    url: "https://kataster.skgeodesy.sk/eskn/services/NR/kn_wms_orto/MapServer/WMSServer?",
    params: {
      LAYERS: [4, 5, 6, 8, 12, 13],
      FORMAT: "image/png",
    },
    attributions: "© Úrad geodézie, kartografie a katastra SR",
  }),
  visible: false,
  zIndex: 1,
  title: "parcelyRegistraCCheckbox",
});

const esknRegisterE = new Tile({
  source: new TileWMS({
    url: "https://kataster.skgeodesy.sk/eskn/services/NR/uo_wms_orto/MapServer/WMSServer?",
    params: {
      LAYERS: [0],
      FORMAT: "image/png",
    },
    attributions: "© Úrad geodézie, kartografie a katastra SR",
  }),
  visible: false,
  zIndex: 1,
  title: "parcelyRegistraECheckbox",
});

const listOfBuildingsLayer = new Tile({
  source: new TileWMS({
    url: "http://zoznamstavieb.skgeodesy.sk/stavby/services/WMS/zoznam_stavieb_wms/MapServer/WmsServer?",
    params: {
      LAYERS: 0,
      FORMAT: "image/png",
    },
    attributions: "© Úrad geodézie, kartografie a katastra SR",
  }),
  visible: false,
  zIndex: 1,
  title: "listOfBuildingsCheckbox",
});

//add eskn tile layers to layer group
const esknLayersGroup = new Group({
  layers: [esknRegisterC, esknRegisterE, listOfBuildingsLayer],
});
map.addLayer(esknLayersGroup);

//logic for eskn layers checkboxes
const esknLayersCheckboxes = document.querySelectorAll(
  ".sidebar-layers-container > input[type=checkbox]"
);
for (let esknLayerCheckbox of esknLayersCheckboxes) {
  esknLayerCheckbox.addEventListener("change", function () {
    let esknLayerCheckboxValue = this.value;
    let esknLayer;
    esknLayersGroup.getLayers().forEach(function (element) {
      if (esknLayerCheckboxValue === element.get("title")) {
        esknLayer = element;
      }
    });
    this.checked ? esknLayer.setVisible(true) : esknLayer.setVisible(false);
  });
}

//initialize and add geojson vector layer to map
const geojsonVectorLayer = new VectorLayer({
  source: new VectorSource({
    url: data,
    format: new GeoJSON(),
  }),
  visible: true,
  title: "geojsonData",
});
map.addLayer(geojsonVectorLayer);

//fullScreen control added
const fullScreenControl = new FullScreen({
  tipLabel: "Zobraziť na celú obrazovku",
});
map.addControl(fullScreenControl);

//set tipeLabel values in Slovak

//scaleline control added
const scaleLIneControl = new ScaleLine({});
map.addControl(scaleLIneControl);

// show name from feature on coordinates which was clicked based on pixel
const popupContainerElement = document.querySelector(".overlay-container");
const popup = new Overlay({
  element: popupContainerElement,
  positioning: "center-left",
});
map.addOverlay(popup);

const overlayFeatureName = document.getElementById("feature-name");

map.on("click", function (e) {
  const clickedCoordinate = e.coordinate;
  popup.setPosition(undefined);
  map.forEachFeatureAtPixel(
    e.pixel,
    function (feature) {
      let featureName = feature.get("name");
      if (featureName != undefined) {
        popup.setPosition(clickedCoordinate);
        overlayFeatureName.innerHTML = featureName;
      }
    },
    {
      layerFilter: function (layerCandidate) {
        return layerCandidate.get("title") === "geojsonData";
      },
    }
  );
});

//geolocation API
const viewProjection = map.getView().getProjection();
const geolocation = new Geolocation({
  tracking: true,
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: viewProjection,
});

geolocation.on("change:position", function (e) {
  let geolocationSjtsk = this.getPosition();
  map.getView().setCenter(geolocationSjtsk);
});
