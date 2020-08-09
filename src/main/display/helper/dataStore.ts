// Singleton to store default information

class DataStore {

    generalInfo: {[key: string]: number};

    setGeneralInfo(generalInfo) {
        this.generalInfo = generalInfo;
    }

    getGeneralInfo() {
        return this.generalInfo;
    }

    updatePrecip(ratio) {
        this.generalInfo.avgPrecip *= ratio;
        this.generalInfo.maxPrecip *= ratio;
        this.generalInfo.minPrecip *= ratio;
    }
}

const store = new DataStore();
export default store;
