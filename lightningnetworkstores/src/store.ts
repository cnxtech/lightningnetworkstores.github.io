import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import { Store } from "./interfaces/Store";
import { Score } from "./interfaces/Score";

const stores: Store[] = require("../data/sites.json");
const scores: any = require("../data/storeScores.json");

Vue.use(Vuex);

const baseUrl = "https://lightningnetworkstores.com/";

export default new Vuex.Store({
    state: {
        stores: [],
        scores: []
    },
    getters: {
        getStore: state => (id: number) => {
            return state.stores.find((store: Store) => store.id == id);
        },
        getStores: state => ({ sector, digitalGoods }: any, sort: string): Store[] => {
            //filter
            console.log(state.scores);
            let stores: Store[] = [];
            if ((!sector || sector == "undefined") && (!digitalGoods || digitalGoods == "undefined")) {
                stores = state.stores;
            } else if (!digitalGoods || digitalGoods == "undefined") {
                stores = sector !== "all" ? state.stores.filter((store: any) => store.sector == sector) : state.stores;
            } else if (!sector || sector == "undefined") {
                stores = digitalGoods !== "all" ? state.stores.filter((store: Store) => store.digital_goods == digitalGoods) : state.stores;
            } else {
                let filteredBySector = sector !== "all" ? state.stores.filter((store: Store) => store.sector == sector) : state.stores;
                stores = digitalGoods !== "all" ? filteredBySector.filter((store: Store) => store.digital_goods == digitalGoods) : filteredBySector;
            }
            //sort
            switch (sort) {
                case "best":
                    stores.sort((a: Store, b: Store) => {
                        return (state.scores[b.id] || [0])[0] - (state.scores[a.id] || [0])[0];
                    });
                    break;
                case "trending":
                    stores.sort((a: Store, b: Store) => {
                        return (state.scores[b.id] || [0])[2] - (state.scores[a.id] || [0])[2];
                    });
                    break;
                case "newest":
                    stores.sort((a: Store, b: Store) => {
                        return b.added - a.added;
                    });
                    break;
                case "controversial":
                    stores.sort((a: Store, b: Store) => {
                        return (state.scores[b.id] || [0])[1] - (state.scores[a.id] || [0])[1];
                    });
                    break;
                case "lastcommented":
                    stores.sort((a: Store, b: Store) => {
                        return (state.scores[b.id] || [0])[3] - (state.scores[a.id] || [0])[3];
                    });
                    break;
                default:
                    stores.sort((a: Store, b: Store) => {
                        return (state.scores[b.id] || [0])[0] - (state.scores[a.id] || [0])[0];
                    });
                    break;
            }

            return stores;
        },
        getScore: state => (id: number): Score => {
            let score = state.scores[id] || [0, 0, 0];
            let rank: any = 1;
            if (score[0] - score[1] !== 0) {
                for (var element in state.scores) {
                    if (state.scores.hasOwnProperty(element)) {
                        if (state.scores[element][0] - state.scores[element][1] > score[0] - score[1]) {
                            rank++;
                        }
                    }
                }
                rank = "#" + rank;
            } else {
                rank = "unranked";
            }

            return { upvotes: score[0], downvotes: score[1], trending: score[2], lastCommented: score[3], rank: rank };
        },
        getImage: state => (id: number) => {
            try {
                return require(`@/assets/images/stores/${id}_override.png`);
            } catch (error) {
                try {
                    return require(`@/assets/images/stores/${id}.png`);
                } catch (error) {
                    return "";
                }
            }
        },
        getBaseUrl: state => () => {
            return baseUrl;
        }
    },
    actions: {
        getStore({}, { id: id }) {
            return axios
                .get(`${baseUrl}storeinfo?id=${id}`)
                .then(response => {
                    return Promise.resolve(response);
                })
                .catch(error => {
                    return Promise.reject(error);
                });
        },
        fetchStores({ commit }) {
            axios
                .get(`${baseUrl}sites.json`)
                .then(response => {
                    commit("setStores", response.data);
                })
                .catch(error => {
                    console.log(error);
                });
        },
        fetchScores({ commit }) {
            axios
                .get(`${baseUrl}storeScores.json`)
                .then(response => {
                    commit("setScores", response.data);
                })
                .catch(error => {
                    console.log(error);
                });
        },
        getStoreVotePaymentRequest({}, { id, amount, isUpvote, comment }) {
            return axios
                .get(`${baseUrl}get_invoice?amount=${amount}&storeID=${id}&direction=${isUpvote ? "Upvote" : "Downvote"}${comment ? "&comment=" + encodeURI(comment) : ""}`)
                .then(response => {
                    return Promise.resolve(response);
                })
                .catch(error => {
                    return Promise.reject(error);
                });
        },
        checkPayment({}, { id: id }) {
            return axios
                .get(`${baseUrl}check_payment?id=${id}`)
                .then(response => {
                    return Promise.resolve(response);
                })
                .catch(error => {
                    return Promise.reject(error);
                });
        }
    },
    mutations: {
        setStores(state, stores) {
            state.stores = stores;
        },
        setScores(state, scores) {
            state.scores = scores;
        }
    }
});