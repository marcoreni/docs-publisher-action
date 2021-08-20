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
            <a class="btn btn-outline-light btn-lg m-2" href="./{{latestVersion}}/"
              role="button">Latest docs</a>
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
        <h4 class="mb-1 text-center text-dark"><strong>Docs</strong></h4>
        <div class="row">
          <div class="col-xs-12 text-right">
            <ul class="list-group list-group-flush">
              {{#each versions}}
                <li class="list-group-item"><a class="text-body" href="./{{this.id}}/">{{this.id}} (released at: {{prettifyDate this.releaseTimestamp}})</a></li>
              {{/each}}
            </ul>
          </div>
        </div>
      </section>
      <!--Section: Content-->
    </div>
  </main>
  <!--Main layout-->
  </body>
</html>`;
