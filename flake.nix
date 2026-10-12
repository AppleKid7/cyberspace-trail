{
  description = "Cyberspace Trail — browser survival run (Vite + TypeScript + bun)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;

        bunLock = ./bun.lock;
        packageJson = ./package.json;

        nodeModules = pkgs.stdenv.mkDerivation {
          pname = "cyberspace-trail-node-modules";
          version = "0.1.0";
          src = ./.;
          nativeBuildInputs = [ pkgs.bun ];
          dontConfigure = true;
          buildPhase = ''
            export HOME=$TMPDIR
            bun install --frozen-lockfile --no-progress
          '';
          installPhase = ''
            mkdir -p $out
            cp -R node_modules $out/
          '';
          outputHashMode = "recursive";
          outputHash = if system == "x86_64-linux" then
            "sha256-jeAyazBTt5uFr/hfLjKL8OSGXEF9j/dz6oux0ZYmvyQ="
          else if system == "aarch64-linux" then
            "sha256-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="
          else
            "sha256-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=";
        };

        cyberspace-trail = pkgs.stdenv.mkDerivation {
          pname = "cyberspace-trail";
          version = "0.1.0";
          src = ./.;
          nativeBuildInputs = [ pkgs.bun pkgs.zip pkgs.nodejs ];
          buildPhase = ''
            rm -rf node_modules dist
            cp -R ${nodeModules}/node_modules node_modules
            chmod -R u+w node_modules
            export TMPDIR="$TMPDIR/vite-cache"
            mkdir -p "$TMPDIR"
            ${pkgs.nodejs}/bin/node node_modules/vite/bin/vite.js build
            (cd dist && ${pkgs.zip}/bin/zip -r "$PWD/../cyberspace-trail-itch.zip" .)
          '';
          installPhase = ''
            mkdir -p $out
            cp -R dist $out/
            cp cyberspace-trail-itch.zip $out/
          '';
        };
      in
      {
        packages = {
          default = cyberspace-trail;
          node-modules = nodeModules;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            zip
            nodejs
            typescript
          ];
          shellHook = ''
            echo "Cyberspace Trail dev shell"
            echo "  bun install    # refresh node_modules locally"
            echo "  bun run dev    # Vite dev server"
            echo "  bun test       # logic tests"
            echo "  bun run balance"
            echo "  nix build      # dist/ + itch zip (update node-modules hash first)"
          '';
        };
      });
}
