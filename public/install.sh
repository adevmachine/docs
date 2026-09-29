#!/bin/sh
# Install the devmachine CLI.
#
#   curl -fsSL https://mydevmachine.sh/install.sh | sh
#
# On macOS with Homebrew, this installs through the tap. Otherwise it
# downloads the release binary from GitHub and puts it on your PATH.
set -eu

REPO="mydevmachine/devmachine"
TAP="mydevmachine/tap/devmachine"

info() {
  printf '%s\n' "$1"
}

fail() {
  printf 'devmachine install: %s\n' "$1" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "'$1' is required but not found on PATH"
}

detect_os() {
  case "$(uname -s)" in
    Darwin) echo darwin ;;
    Linux) echo linux ;;
    *) fail "unsupported OS: $(uname -s) (devmachine supports macOS and Linux)" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    arm64 | aarch64) echo arm64 ;;
    x86_64 | amd64) echo amd64 ;;
    *) fail "unsupported architecture: $(uname -m)" ;;
  esac
}

have_brew_trust() {
  brew trust --help >/dev/null 2>&1
}

install_via_brew() {
  info "Homebrew found, installing devmachine through the tap"

  if have_brew_trust; then
    brew trust --formula "$TAP" || true
  fi

  if brew list --formula "$TAP" >/dev/null 2>&1; then
    brew upgrade "$TAP"
  else
    brew install "$TAP"
  fi
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

latest_version() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' \
    | head -n1
}

install_via_download() {
  os=$(detect_os)
  arch=$(detect_arch)

  version="${DEVMACHINE_VERSION:-}"
  if [ -z "$version" ]; then
    info "Looking up the latest devmachine release"
    version=$(latest_version)
    [ -n "$version" ] || fail "could not find the latest release of ${REPO}"
  fi

  version_number=${version#v}
  archive="devmachine_${version_number}_${os}_${arch}.tar.gz"
  base_url="https://github.com/${REPO}/releases/download/${version}"

  workdir=$(mktemp -d)
  trap 'rm -rf "$workdir"' EXIT

  info "Downloading devmachine ${version} for ${os}/${arch}"
  curl -fsSL -o "${workdir}/${archive}" "${base_url}/${archive}" \
    || fail "could not download ${archive} (is ${version} a real release?)"
  curl -fsSL -o "${workdir}/checksums.txt" "${base_url}/checksums.txt" \
    || fail "could not download checksums.txt for ${version}"

  expected=$(grep " ${archive}\$" "${workdir}/checksums.txt" | awk '{print $1}')
  [ -n "$expected" ] || fail "${archive} is not listed in checksums.txt"

  actual=$(sha256_of "${workdir}/${archive}")
  [ "$expected" = "$actual" ] || fail "checksum mismatch for ${archive}"

  tar -xzf "${workdir}/${archive}" -C "$workdir" devmachine

  install_dir="${DEVMACHINE_INSTALL_DIR:-$HOME/.local/bin}"
  mkdir -p "$install_dir"
  mv "${workdir}/devmachine" "${install_dir}/devmachine"
  chmod +x "${install_dir}/devmachine"

  info "Installed devmachine to ${install_dir}/devmachine"

  case ":${PATH}:" in
    *":${install_dir}:"*) ;;
    *)
      info ""
      info "${install_dir} is not on your PATH. Add it, for example:"
      info "  export PATH=\"${install_dir}:\$PATH\""
      ;;
  esac

  "${install_dir}/devmachine" version
}

need_cmd curl
need_cmd tar

if [ "$(detect_os)" = "darwin" ] && [ "${DEVMACHINE_NO_BREW:-}" != "1" ] && command -v brew >/dev/null 2>&1; then
  install_via_brew
  devmachine version
else
  command -v sha256sum >/dev/null 2>&1 || need_cmd shasum
  install_via_download
fi

info ""
info "Next step: devmachine setup"
