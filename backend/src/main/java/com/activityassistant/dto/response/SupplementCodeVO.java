package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupplementCodeVO {

    private String activityId;

    private String code;

    private Boolean valid;

    private String message;
}
