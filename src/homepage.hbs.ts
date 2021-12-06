export default `<!DOCTYPE html>
<html>
  <head>
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet" />
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
    <!-- MDB -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.6.0/mdb.min.css" rel="stylesheet" />
  </head>
  <body>

<body>
  <!--Main Navigation-->
  <header>
    <style>
      #intro {
        height: 40vh !important;
      }
    </style>

    <!-- Background image -->
    <div id="intro" class="bg-image vh-100 shadow-1-strong">
      <div class="mask" style="
            background: linear-gradient(
              45deg,
              rgba(29, 236, 197, 0.7),
              rgba(91, 14, 214, 0.7) 100%
            );
          ">
        <div class="container d-flex align-items-center justify-content-center text-center h-100">
          <div class="text-white">
            <h1 class="mb-3">{{projectName}}</h1>
            <a class="btn btn-outline-light btn-lg m-2" href="{{repositoryUrl}}" role="button"
              rel="nofollow" target="_blank"><i class="fab fa-github"></i> Source code</a>
            {{#each packages}}
              {{#ifeq @key "default" }}
                <a class="btn btn-outline-light btn-lg m-2" href="./{{this.latestVersion.path}}/"
                  role="button">Latest ({{this.latestVersion.id}}) docs</a>
              {{else}}
                <a class="btn btn-outline-light btn-lg m-2" href="./{{this.latestVersion.path}}/"
                  role="button">Latest {{this.latestVersion.packageName}} ({{this.latestVersion.id}}) docs</a>
              {{/ifeq}}
            {{/each}}
            {{#each packages}}
              {{#if this.latestPrereleaseVersion }}
                {{#ifeq @key "default" }}
                  <a class="btn btn-outline-light btn-lg m-2" href="./{{this.latestVersion.path}}/"
                    role="button">Latest prerelease ({{this.latestVersion.id}}) docs</a>
                {{else}}
                  <a class="btn btn-outline-light btn-lg m-2" href="./{{this.latestVersion.path}}/"
                    role="button">Latest {{this.latestVersion.packageName}} prerelease ({{this.latestVersion.id}}) docs</a>
                {{/ifeq}}
              {{/if}}
            {{/each}}
          </div>
        </div>
      </div>
    </div>
    <!-- Background image -->
  </header>
  <!--Main Navigation-->

  <!--Main layout-->
  <main class="mt-5">
    <div class="container docs">
      <!--Section: Content-->
      <section>
        {{#each packages as |p|}}
          <h4 class="mb-1 text-center text-dark"><strong>{{#ifeq @key "default"}}Docs{{else}}{{@key}}{{/if}}</strong></h4>
          <div class="row">
            <div class="{{#if p.prereleaseVersions}}col-md-6{{/if}} col-xs-12">
              {{#if p.prereleaseVersions}}
                <h4 class="mb-1 text-center text-dark"><strong>Releases</strong></h4>
              {{/if}}
              <ul class="list-group list-group-flush">
                {{#each p.versions as |v| }}
                  <li class="list-group-item"><a class="text-body" href="./{{v.path}}/">{{v.id}} (released on: {{prettifyDate v.releaseTimestamp}})</a></li>
                {{/each}}
              </ul>
            </div>
            {{#if p.prereleaseVersions }}
              <div class="col-md-6 col-xs-12">
                <h4 class="mb-1 text-center text-dark"><strong>Prereleases</strong></h4>
                <ul class="list-group list-group-flush">
                  {{#each p.prereleaseVersions as |pv| }}
                    <li class="list-group-item"><a class="text-body" href="./{{pv.path}}/">{{pv.id}} (released on: {{prettifyDate pv.releaseTimestamp}})</a></li>
                  {{/each}}
                </ul>
              </div> 
            {{/if}}
          </div>
        {{/each}}
      </section>
      <!--Section: Content-->
    </div>
  </main>
  <!--Main layout-->
  </body>
</html>`;
