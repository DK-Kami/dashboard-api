const https = require('https');

function summReduceBy(array, key, startValue = 0) {
  return array.reduce((summ, current) => summ + +current[key], startValue);
};
function getAverage(array, key) {
  return summReduceBy(array, key) / array.length;
};
function createNameValueArray(array, key) {
  return array.map(item => ({
    name: item.name,
    [key]: item[key],
  }));
}

class BaseRepos {
  constructor(token, {
    commitsUrl = '/commits',
    reposUrl = '/repos',
    baseUrl = 'git',
  }) {
    this.baseUrl = baseUrl;
    this.urls = {
      COMMITS: commitsUrl,
      REPOS: reposUrl,
    };

    this.options = {
      method: 'GET',
      host: 'api.github.com',
      headers: {
        'Authorization': 'Bearer ' + token,
        'user-agent': 'node.js',
      },
    };
  }

  get(url) {
    return new Promise((res, rej) => {
      const path = [this.baseUrl, url].join('/');
      let body = '';

      const request = https.request(path, this.options, response => {
        response.on('data', data => {
          body += data;
        });

        response.on('end', () => {
          if (typeof body === 'string') {
            console.log('true');
            body = JSON.parse(body);
          }
          res(body);
        })
      });

      request.on('error', (e) => {
        rej(e);
      });
      request.end();
    });
  }

  async getAllStatistic() {
    const reposData = await this.getReposData(this.urls.REPOS);

    return {
      ...reposData,
    };
  }

  parseRepos(res) {
    return res;
  }
  parseDate(date) {
    return date;
  }

  async getReposData(url) {
    const res = this.parseRepos(await this.get(url));

    const watchers = this.getCharDataBy(res, 'watchers');
    const issues = this.getCharDataBy(res, 'issues');
    const stars = this.getCharDataBy(res, 'stars');
    const sizes = this.getCharDataBy(res, 'size');

    const topUsedLanguage = this.createTopUsedLanguage(res);
    const reposCount = this.getCountRepos(res);
    const names = this.getAllReposName(res);

    const createdDates = this.createNameDateArray(res, 'createdDate');
    const pushedDates = this.createNameDateArray(res, 'pushedDate');

    return {
      topUsedLanguage,
      reposCount,
      watchers,
      issues,
      stars,
      sizes,
      names,

      createdDates,
      pushedDates,
    };
  }

  createTopUsedLanguage(res) {
    const languages = [...new Set(res.map(repo => repo.language))];
    const top = languages.map(lang => ({
      count: res.filter(repo => repo.language === lang).length,
      language: lang || 'Нe определён',
    }))
      .sort((p, n) => p.count < n.count ? 1 : -1);

    return {
      count: languages.filter(l => !!l).length,
      top,
    };
  }

  getCharDataBy(res, key) {
    const values = createNameValueArray(res, key)

    return {
      summ: summReduceBy(values, key).toFixed(2),
      average: getAverage(values, key).toFixed(2),
      [key + 's']: values,
    };
  }

  getCountRepos(res) {
    if (Array.isArray(res)) {
      return res.length;
    }
    return 0;
  }

  createNameDateArray(res, key) {
    const dates = createNameValueArray(res, key);
    return dates.map(d => ({
      date: this.parseDate(d[key]),
      name: d.name,
    }))
  }

  getAllReposName(res) {
    return res.map(repo => repo.name);
  }
};

module.exports = BaseRepos;