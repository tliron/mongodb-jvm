/**
 * Copyright 2010-2016 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

import jdk.nashorn.internal.objects.NativeNumber;

/**
 * A BSON codec for Nashorn's {@link NativeNumber}.
 * 
 * @author Tal Liron
 */
public class NativeNumberCodec implements Codec<NativeNumber>
{
	//
	// Codec
	//

	public Class<NativeNumber> getEncoderClass()
	{
		return NativeNumber.class;
	}

	public void encode( BsonWriter writer, NativeNumber nativeNumber, EncoderContext encoderContext )
	{
		writer.writeDouble( nativeNumber.getValue() );
	}

	public NativeNumber decode( BsonReader reader, DecoderContext decoderContext )
	{
		return (NativeNumber) NativeNumber.constructor( true, null, reader.readDouble() );
	}
}
