import { createDictionaryStore } from '@lumal/core/dictionary';
import { application, service } from '../../../app/services/session';

export const dictionaryStore = createDictionaryStore({
  fetcher: async (code) => ({
    items: await service.request('GET', `/system/dictionaries/options/${encodeURIComponent(code)}`),
  }),
});
application.onReset(() => dictionaryStore.clearDictionary());
