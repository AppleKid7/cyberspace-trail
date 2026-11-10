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
        # This machine uses the baseline x64 build; preserve other platforms.
        bun =
          if system != "x86_64-linux" || lib.versionAtLeast pkgs.bun.version "1.4.4" then pkgs.bun
          else pkgs.bun.overrideAttrs (_: {
            version = "1.4.4";
            src = pkgs.fetchurl {
              url = "https://github.com/oven-sh/bun/releases/download/bun-v1.4.4/bun-linux-x64-baseline.zip";
              hash = "sha256-4ERutVmVdy65iUvrrppr42jZhai5Jx7hJEhvmUbu3XY=";
            };
          });

        bunLock = ./bun.lock;
        packageJson = ./package.json;

        nodeModules = pkgs.stdenv.mkDerivation {
          pname = "cyberspace-trail-node-modules";
          version = "0.1.0";
          src = ./.;
          nativeBuildInputs = [ bun ];
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
          nativeBuildInputs = [ bun pkgs.zip ];
          buildPhase = ''
            rm -rf node_modules dist
            cp -R ${nodeModules}/node_modules node_modules
            chmod -R u+w node_modules
            export TMPDIR="$TMPDIR/vite-cache"
            mkdir -p "$TMPDIR"
            bun node_modules/vite/bin/vite.js build
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
