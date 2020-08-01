// Singleton to store default information

class DataStore {

    generalInfo: {[key: string]: number};

    setGeneralInfo(generalInfo) {
        this.generalInfo = generalInfo;
    }

    getGeneralInfo() {
        return this.generalInfo;
    }
}

const store = new DataStore();
export default store;
