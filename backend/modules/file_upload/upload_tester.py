"""
File Upload Vulnerability Tester
Tests for unrestricted file upload, path traversal via filenames, and file type bypass.
"""

import os
import io
from typing import Dict, List
from utils.logger import get_logger

logger = get_logger(__name__)


class FileUploadTester:
    """Test for file upload vulnerabilities."""

    def __init__(self, http_client, config: Dict):
        self.http_client = http_client
        self.config = config
        self.upload_config = config.get("file_upload", {})

    def test_file_upload(self, url: str, context: Dict) -> List[Dict]:
        """
        Run file upload vulnerability tests on the given endpoint.

        Args:
            url: Target upload URL
            context: Request context (headers, response, etc.)

        Returns:
            List of discovered vulnerabilities
        """
        vulnerabilities: List[Dict] = []

        if not self.upload_config.get("enabled", True):
            return vulnerabilities

        if self.upload_config.get("test_file_type_bypass", True):
            vulnerabilities.extend(self._test_extension_bypass(url))

        if self.upload_config.get("test_unrestricted_upload", True):
            vulnerabilities.extend(self._test_unrestricted_upload(url))

        if self.upload_config.get("test_path_traversal", True):
            vulnerabilities.extend(self._test_filename_traversal(url))

        return vulnerabilities

    # ------------------------------------------------------------------
    def _test_extension_bypass(self, url: str) -> List[Dict]:
        """Try uploading files with double extensions and null-byte tricks."""
        vulns: List[Dict] = []
        bypass_names = [
            "shell.php.jpg",
            "shell.php%00.jpg",
            "shell.pHp",
            "shell.php5",
            "shell.phtml",
        ]

        dummy_content = b"<?php echo 'test'; ?>"

        for name in bypass_names:
            try:
                files = {"file": (name, io.BytesIO(dummy_content), "image/jpeg")}
                response = self.http_client.post(url, files=files)
                if response and response.status_code in (200, 201):
                    if any(
                        kw in response.text.lower()
                        for kw in ("uploaded", "success", "stored", name.lower())
                    ):
                        vulns.append({
                            "type": "File Upload - Extension Bypass",
                            "severity": "high",
                            "url": url,
                            "payload": name,
                            "evidence": f"Server accepted file with name: {name}",
                            "description": "The server accepted a file with a potentially executable extension disguised as an image.",
                            "remediation": "Validate file type server-side using magic bytes, not just the extension.",
                        })
                        break
            except Exception as e:
                logger.debug(f"Extension bypass test error on {url}: {e}")

        return vulns

    # ------------------------------------------------------------------
    def _test_unrestricted_upload(self, url: str) -> List[Dict]:
        """Attempt to upload an executable file type directly."""
        vulns: List[Dict] = []
        dangerous_types = [
            ("test.exe", b"MZ\x90\x00", "application/octet-stream"),
            ("test.jsp", b"<% out.println(); %>", "application/octet-stream"),
            ("test.svg", b'<svg onload="alert(1)"/>', "image/svg+xml"),
        ]

        for name, content, mime in dangerous_types:
            try:
                files = {"file": (name, io.BytesIO(content), mime)}
                response = self.http_client.post(url, files=files)
                if response and response.status_code in (200, 201):
                    if any(
                        kw in response.text.lower()
                        for kw in ("uploaded", "success", "stored")
                    ):
                        vulns.append({
                            "type": "Unrestricted File Upload",
                            "severity": "critical",
                            "url": url,
                            "payload": name,
                            "evidence": f"Server accepted dangerous file: {name}",
                            "description": "The server allows uploading executable or dangerous file types without restriction.",
                            "remediation": "Implement a strict allow-list of permitted MIME types and extensions.",
                        })
                        break
            except Exception as e:
                logger.debug(f"Unrestricted upload test error on {url}: {e}")

        return vulns

    # ------------------------------------------------------------------
    def _test_filename_traversal(self, url: str) -> List[Dict]:
        """Attempt path traversal via crafted filenames."""
        vulns: List[Dict] = []
        traversal_names = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\win.ini",
            "....//....//test.txt",
        ]

        for name in traversal_names:
            try:
                files = {"file": (name, io.BytesIO(b"traversal-test"), "text/plain")}
                response = self.http_client.post(url, files=files)
                if response and response.status_code in (200, 201):
                    vulns.append({
                        "type": "File Upload - Path Traversal",
                        "severity": "high",
                        "url": url,
                        "payload": name,
                        "evidence": f"Server accepted file with traversal name: {name}",
                        "description": "The server does not sanitize uploaded file names, allowing path traversal.",
                        "remediation": "Strip directory separators from uploaded filenames and use server-generated names.",
                    })
                    break
            except Exception as e:
                logger.debug(f"Filename traversal test error on {url}: {e}")

        return vulns
