package com.leetcode.leetcode_push.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CodeDto {
    String client_id;
    String client_secret;
    String code;
}
